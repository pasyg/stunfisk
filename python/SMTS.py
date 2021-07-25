import random

class DecisionNode():
    def __init__(self):
        self.actions =  None
        self.chance = None
        self.regrets = None
        self.strategies = None

class ChanceNode():
    def __init__(self):
        self.X = 0
        self.n = 0
        self.decision = dict()

class Search():
    def normalizedPositive(self, regrets):
        epsilon = 10**-3
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
        dnode.actions = state.actions
        dnode.regrets = [[0 for a in A] for A in state.actions]
        dnode.strategies = [[0 for a in A] for A in state.actions]
        dnode.chance = dict()
        for i, a in enumerate(dnode.actions[0]):
            for j, b in enumerate(dnode.actions[1]):
                dnode.chance[(i, j)] = ChanceNode()

    def accessChance(self, cnode, hash):
        if hash in cnode.decision:
            return cnode.decision[hash]
        dnode = DecisionNode()
        cnode.decision[hash] = dnode
        return dnode

    def valueChance(self, cnode):
        return cnode.X/(cnode.n + (not cnode.n))

    def strategyDecision(self, dnode):
        return self.normalizedPositive(dnode.strategies)

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
        #print('depth:', depth)
        if dnode.actions is None:
            self.expandDecision(dnode, state)
            payoff = state.rollout()
            #print('node is unexanded', payoff)
            #print(dnode)
            return payoff
        
        if not all(dnode.actions):
            payoff = state.rollout()
            #print('node is terminal', payoff)
            return payoff

        #print('regrets', dnode.regrets)
        strategies = self.normalizedPositive(dnode.regrets)
        #print('strategies', strategies)
        sample = self.sampleDistributions(strategies)
        #print()
        #print('sampling:', sample)
        cnode = dnode.chance[sample]
        #print('cnode', cnode)

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
            #print('depth:', depth)
            if dnode.actions is None:
                self.expandDecision(dnode, state)
                payoff = state.rollout()
                #print('node is unexanded', payoff)
                #print(dnode)
                return payoff
            
            if not all(dnode.actions):
                payoff = state.rollout()
                #print('node is terminal', payoff)
                return payoff

            #print('regrets', dnode.regrets)
            strategies = self.normalizedPositive(dnode.regrets)
            #print('strategies', strategies)
            sample = self.sampleDistributions(strategies)
            #print()
            #print('sampling:', sample)
            cnode = dnode.chance[sample]
            #print('cnode', cnode)

            state_, hash = state.transition(sample)

            dnode_ = self.accessChance(cnode, hash)

            payoff = self.run(dnode_, state_, gamma, depth+1)

            regrets = self.expectedRegretsDecision(dnode, strategies)

            self.accumulate(dnode.strategies, strategies)

            self.accumulate(dnode.regrets, regrets)

            cnode.n += 1

            cnode.X += payoff

            return self.valueChance(cnode)