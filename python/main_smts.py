from typing import final
import SMTS
import State
import numpy

def batch(n, sim):
    print('batch:', n, sim)
    state = State.ZeroSumPureTree()
    state.expand(value=0, depth=4, actions=[[0, 1]], layer=0)
    dnode = state
    search = SMTS.Display()

    for _ in range(n):

        for _ in range(sim): search.runExpected(dnode, state)

        finalStategy = search.normalizedPositive(dnode.strategies)
        print(finalStategy)
        print('M', search.exploitability(state.M, finalStategy))
        print('chance', search.exploitability(search.valueChanceMatrix(dnode), finalStategy))

        print(state.M)
        print(search.valueChanceMatrix(dnode))
        state.reset()

batch(1, 10**5)