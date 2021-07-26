from typing import final
import SMTS
import State
import numpy

def batch(state, n=1, seconds=8):
    print("n, seconds", n, seconds)
    dnode = state
    search = SMTS.Display()
    KnownExplotability = []
    ActualExplotability = [] 
    Sims = []

    for _ in range(n):

        sim = search.runTimed(seconds, dnode, state)
        Sims.append(sim)
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
    return sum(Sims)/n

def batchExpected(state, n=1, seconds=8):
    print("n, seconds -e", n, seconds)
    dnode = state
    search = SMTS.Display()
    KnownExplotability = []
    ActualExplotability = [] 
    Sims = []

    for _ in range(n):

        sim = search.runTimedExpected(seconds, dnode, state)
        Sims.append(sim)
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
    return sum(Sims)/n

state = State.ZeroSumPureTree()
state.expand(value=0, depth=4, actions=[[0, 1, 2, 3]], layer=0)

print(batch(state, 2**6, 4))
print(batchExpected(state, 2**6, 4))