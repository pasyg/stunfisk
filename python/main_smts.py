import SMTS
import State
import numpy

def batch(n, sim):
    print('batch:', n, sim)

    s = [[0, 0], [0, 0]]
    l = []
    k = []

    for _ in range(n):
        M = numpy.matrix([[0, -1], [-1, 1]]) 
        state = State.Matrix([[0, 1], [0, 1]], M)
        dnode = SMTS.DecisionNode()
        search = SMTS.Search()
        for _ in range(sim): search.run(dnode, state)
        sigma = search.normalizedPositive(dnode.strategies)
        search.accumulate(s, sigma)
        l.append(sigma)
        k.append(search.normalizedPositive(dnode.regrets))

    print(search.normalizedPositive(s))
    return l, k 

l, k = batch(10, 5000)
for _, __ in zip(l, k):
    print(_)
    print(__)
    print()