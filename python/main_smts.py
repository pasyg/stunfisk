from typing import final
import SMTS
import State
import numpy

def batch(n=1, seconds=8):
    state = State.ZeroSumPureTree()
    state.expand(value=0, depth=4, actions=[[0, 1, 2, 3]], layer=0)
    dnode = state
    search = SMTS.Display()

    KnownExplotability = []
    ActualExplotability = [] 

    for _ in range(n):

        search.runTimed(seconds, dnode, state)

        finalStategy = search.normalizedPositive(dnode.strategies)
        KnownExplotability.append(search.exploitability(search.valueChanceMatrix(dnode), finalStategy))
        ActualExplotability.append(search.exploitability(state.M, finalStategy))

        state.reset()

    mke = sum(KnownExplotability)/n
    mae = sum(ActualExplotability)/n
    vke = sum((_ - mke)**2 for _ in KnownExplotability)
    vae = sum((_ - mae)**2 for _ in ActualExplotability)

    print('mke', mke)
    print('mae', mae)
    print('vke', vke)
    print('vae', vae)

def batchExpected(n=1, seconds=8):
    state = State.ZeroSumPureTree()
    state.expand(value=0, depth=4, actions=[[0, 1, 2, 3]], layer=0)
    dnode = state
    search = SMTS.Display()

    KnownExplotability = []
    ActualExplotability = [] 

    for _ in range(n):

        search.runTimedExpected(seconds, dnode, state)

        finalStategy = search.normalizedPositive(dnode.strategies)
        KnownExplotability.append(search.exploitability(search.valueChanceMatrix(dnode), finalStategy))
        ActualExplotability.append(search.exploitability(state.M, finalStategy))

        state.reset()

    mke = sum(KnownExplotability)/n
    mae = sum(ActualExplotability)/n
    vke = sum((_ - mke)**2 for _ in KnownExplotability)
    vae = sum((_ - mae)**2 for _ in ActualExplotability)

    print('mke', mke)
    print('mae', mae)
    print('vke', vke)
    print('vae', vae)

batch(16)
batchExpected(16)