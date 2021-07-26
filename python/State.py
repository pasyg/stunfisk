import SMTS
import random
import numpy

class ZeroSumPureTree(SMTS.DecisionNode):

    def __init__(self):

        self.value = None
        self.actions_ = None
        self.M = None
        self.layer = None
        super().__init__()
    
    def expand(self, value, depth, actions=[[0, 1]], layer=0):
        
        self.value = value
        self.layer = layer

        if not depth:
            self.actions_ = [[], []]
            return

        self.actions_ = [random.choice(actions) for _ in range(2)]
        self.M = numpy.zeros(tuple(map(len, self.actions_)))

        index = tuple(random.choice(A) for A in self.actions_)
        for i in self.actions_[0]:
            for j in self.actions_[1]:
                lower = -1
                upper = 1
                if i == index[0]: lower = value
                if j == index[1]: upper = value
                value_ = random.uniform(lower, upper)
                chance = SMTS.ChanceNode()
                self.value = value
                self.M[i,j] = value_
                self.chance[(i,j)] = chance
                chance.decision[0] = ZeroSumPureTree()
                chance.decision[0].expand(value_, depth-1, actions, layer+1)

    def transition(self, sample):
        return self.chance[sample].decision[0], 0

    def rollout(self):
        if all(self.actions_):
            sample = tuple(random.choice(_) for _ in self.actions_)
            chance = self.chance[sample]
            return chance.decision[0].rollout()
        return self.value

    def reset(self):
        self.actions = None
        self.regrets = None
        self.strategies = None
        for chance in self.chance.values():
            chance.X = 0
            chance.n = 0
            dnode = chance.decision[0]
            dnode.reset()