import random

class State():

    def __init__(self, actions):
        self.actions = actions

    def transition(self, sample):
        pass

    def rollout(self):
        pass

class Matrix(State):

    def __init__(self, actions, M):
        super().__init__(actions)
        self.M = M
        self.value = None

    def transition(self, sample):
        terminal = Matrix([[],[]], None)
        terminal.value = self.M[sample[0], sample[1]]
        return terminal, 0

    def rollout(self):
        if all(self.actions):
            sample = tuple(random.choice(A) for A in self.actions)
            nextState, hash = self.transition(sample)
            return nextState.rollout()
        else:
            return self.value

if __name__ == '__main__':
    pass