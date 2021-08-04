SMTS contains the search class, which houses algorithm 2, 3, 4 from

https://arxiv.org/pdf/1804.09045.pdf

The file also contains the tree structure as DecisionNode and ChanceNode
The implementation is almost a line by line exposiion of the pseudocode from the paper

Chance nodes work by using a hash given by the state.transition function.
This hash should uniquely identify each branch from the chance node, or the 'RNG' at that turn.

State contains the implementation of an abstract tree game, called NodeGame, for testing.
For convenience, the tree class extends the decisionNode class.
It's basically like the search is creating it search tree normally, but this tree already exists in memory.
However since the tree's search statistics are not initialized (at least not the ones in the algorithm),
the algorithm executes normally as if its discovering the tree live.

Unfortunately only a simple implementation NodeGamePure is currently finished, which only accomodates matrices with pure equilibrium and deterministic transitions
General random SMGs will be implemented soon.