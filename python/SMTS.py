import math
import random
import numpy
import time

class DecisionNode():
    def __init__(self):
        self.actions =  None
        self.regrets = None
        self.strategies = None
        self.chance = dict()

class ChanceNode():
    def __init__(self):
        self.X = 0
        self.n = 0
        self.decision = dict()

class Search():
    def normalizedPositive(self, regrets, epsilon=10**-3):
        padded = [[max(__, epsilon) for __ in _] for _ in regrets]
        sums = [sum(_) for _ in padded]
        normalized = [[___/__ for ___ in _] for _, __ in zip(padded, sums)]
        return normalized

    def sampleNormalized(self, strategy):
        seed = random.random()
        for i, p in enumerate(strategy):
            seed -= p
            if seed < 0:
                return  i
        return len(strategy) - 1

    def sampleDistributions(self, strategies):
        return tuple(self.sampleNormalized(strategy) for strategy in strategies)

    def accumulate(self, x, y):
        for _, __ in zip(x, y):
            for i in range(len(_)):
                _[i] += __[i]

    def expandDecision(self, dnode, state):
        dnode.actions = state.actions_
        dnode.regrets = [[0 for a in A] for A in state.actions]
        dnode.strategies = [[0 for a in A] for A in state.actions]
        #for i, a in enumerate(dnode.actions[0]):
        #    for j, b in enumerate(dnode.actions[1]):
        #        dnode.chance[(i, j)] = ChanceNode()

    def accessChance(self, cnode, hash):
        if hash in cnode.decision:
            return cnode.decision[hash]
        dnode = DecisionNode()
        cnode.decision[hash] = dnode
        return dnode

    def valueChance(self, cnode):
        return cnode.X/(cnode.n + (not cnode.n))

    def expectedPayoffDecision(self, dnode, strategies):
        u = 0
        for a, p in enumerate(strategies[0]):
            for b, q in enumerate(strategies[1]):
                u += p*q*self.valueChance(dnode.chance[(a, b)])
        return u

    def regretsDecision(self, dnode, sample, u):
        regrets = []
        for p in range(2):
            A = dnode.actions[p]
            v = u * (-1)**p
            regret = []
            for a in A:
                if a == sample[p]:
                    regret.append(0)
                    continue
                contrasample = list(sample)
                contrasample[p] = a
                contrasample = tuple(contrasample)
                w = self.valueChance(dnode.chance[contrasample]) * (-1)**p
                regret.append(w - v)
            regrets.append(regret)
        return regrets

    def expectedRegretsDecision(self, dnode, strategies):
        regrets = []
        for p in range(2):
            u = self.expectedPayoffDecision(dnode, strategies) * (-1)**p
            regret = []
            A = dnode.actions[p]
            for a in A:
                constastrategy = strategies[:]
                constastrategy[p] = [_ == a for _ in A]
                v = self.expectedPayoffDecision(dnode, constastrategy) * (-1)**p
                regret.append(v - u)
            regrets.append(regret)
        return regrets

    def run(self, dnode, state, gamma=0, depth=0):
        if dnode.actions is None:
            self.expandDecision(dnode, state)
            payoff = state.rollout()
            return payoff
        
        if not all(dnode.actions):
            payoff = state.rollout()
            return payoff

        strategies = self.normalizedPositive(dnode.regrets)
        strategies = self.normalizedPositive(strategies, gamma/4) #noise inversely proportional to action set size... fine for square matrix
        sample = self.sampleDistributions(strategies)
        cnode = dnode.chance[sample]
        state_, hash = state.transition(sample)
        dnode_ = self.accessChance(cnode, hash)
        payoff = self.run(dnode_, state_, gamma, depth+1)
        regrets = self.regretsDecision(dnode, sample, payoff)

        self.accumulate(dnode.strategies, strategies)
        self.accumulate(dnode.regrets, regrets)
        cnode.n += 1
        cnode.X += payoff

        return self.valueChance(cnode)

    def runExpected(self, dnode, state, gamma=0, depth=0):
        if dnode.actions is None:
            self.expandDecision(dnode, state)
            payoff = state.rollout()
            return payoff
        
        if not all(dnode.actions):
            payoff = state.rollout()
            return payoff

        strategies = self.normalizedPositive(dnode.regrets)
        strategies = self.normalizedPositive(strategies, gamma/4)
        sample = self.sampleDistributions(strategies)
        cnode = dnode.chance[sample]
        state_, hash = state.transition(sample)
        dnode_ = self.accessChance(cnode, hash)
        payoff = self.run(dnode_, state_, gamma, depth+1)
        regrets = self.expectedRegretsDecision(dnode, strategies)

        self.accumulate(dnode.strategies, strategies)
        self.accumulate(dnode.regrets, regrets)
        cnode.n += 1
        cnode.X += payoff

        return self.valueChance(cnode)

class Display(Search):

    def __init__(self, search=None):
        super().__init__()

    def valueChanceMatrix(self, dnode):
        actions = dnode.actions
        M = numpy.zeros(tuple(map(len, actions)))
        for a in actions[0]:
            for b in actions[1]:
                M[a, b] = round(self.valueChance(dnode.chance[(a,b)]), 4)
        return M

    def strategiesMatrix(self, strategies):
        strategies
        A = numpy.matrix(strategies[0])
        B = numpy.matrix(strategies[1]).T
        return A, B

    def expectedPayoff(self, M, strategies):
        A, B = self.strategiesMatrix(strategies)
        return numpy.matmul(numpy.matmul(A, M), B)

    def exploitability(self, M, strategies):
        A, B = self.strategiesMatrix(strategies)
        return numpy.max(numpy.matmul(M, B)) - numpy.min(numpy.matmul(A, M))

    def runTimed(self, seconds, dnode, state, gamma=0):
        ahead = time.time() + seconds
        sim = 0
        while True:
            self.run(dnode, state, gamma)
            sim += 1
            if time.time() > ahead:
                return sim

    def runTimedExpected(self, seconds, dnode, state, gamma=0):
        ahead = time.time() + seconds
        sim = 0
        while True:
            self.runExpected(dnode, state, gamma)
            sim += 1
            if time.time() > ahead:
                return sim

    def KLDivergence(self, P, Q):
        return sum(p * math.log(p / q) for p, q in zip(P, self.normalizedPositive([Q])[0]))

    def runUntilClose(self, dnode):
        pass