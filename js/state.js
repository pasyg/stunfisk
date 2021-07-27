const SMTS = require("./SMTS")

class NodeTree extends SMTS.DecisionNode {
    constructor(){
        super()
        this.value = 0
        this.actions = [[0, 1, 2, 3, 4, 5, 6, 7, 8], [0, 1, 2, 3, 4, 5, 6, 7, 8]]
    }

    transition(){}
    rollout(){}
}

module.exports = {NodeTree}