const SMTS = require("./SMTS")

class NodeGame extends SMTS.DecisionNode {
    constructor(){
        super()
        this.value = null
        this.actions = null
        this.matrix = null
        this.generation = null
    }
    initialize(){}
    transition(i, j){ //should be updated to allow for multiple branches from chance node
        const n = this.actions[1].length 
        return [this.chance[i*n+j].decision[0], 0]
    }
    rollout(){
        if (this.actions[0].length === 0) return this.value
        const a = Math.floor(Math.random() * this.actions[0].length)
        const b = Math.floor(Math.random() * this.actions[1].length)
        return this.transition(a, b)[0].rollout()
    }
    count(){
        if (this.matrix === null) return 1
        let c = 1
        for (const cnode of this.chance) for (const dnode of cnode.decision) c += dnode.count()
        return c
    }
    print(){
        if (this.matrix === null) return false
        console.log(this.value)
        console.log(this.matrix)
        return true
    }
    printTree(){
        if (this.print()) for (const cnode of this.chance) for (const dnode of cnode.decision) dnode.printTree() //extend hash functionallity 
    }
    resetSearchStats(){
        if(this.chance === null) return
        this.action0 = null
        this.action1 = null
        this.regret0 = null
        this.regret1 = null
        this.strategy0 = null
        this.strategy1 = null
        for (const cnode of this.chance) {
            cnode.X = 0
            cnode.n = 0
            for (const dnode of cnode.decision) dnode.resetSearchStats()
        }
    }
}

class NodeGamePure extends NodeGame {
    constructor(){
        super()
    }
    initialize(value, depth, actions, depthDecrement=[1], generation=0){
        this.value = value
        this.actions = [[], []]
        if (depth <= 0) return
        this.actions = this.actions.map(A => actions[Math.floor(Math.random()*actions.length)])
        let shape = this.actions.map(A => A.length)
        this.chance = new Array(shape[0] * shape[1])
        this.matrix = this.actions[0].map(a => new Array(shape[1]))
        const index = shape.map(x => Math.floor(Math.random() * x))
        for (let i = 0; i < shape[0]; ++i){
            for (let j = 0; j < shape[1]; ++j){
                let lower = -1
                let upper = 1
                if (i == index[0]) lower = value
                if (j == index[1]) upper = value
                const v = lower + (upper - lower) * Math.random()
                this.matrix[i][j] = v
                const cnode = new SMTS.ChanceNode()
                this.chance[i*shape[1]+j] = cnode //used to be last!!!
                cnode.hash = [0]
                cnode.decision = [new NodeGamePure()]
                cnode.decision[0].initialize(
                    v,
                    depth-depthDecrement[Math.floor(Math.random()*depthDecrement.length)],
                    actions,
                    depthDecrement,
                    generation + 1)
            }
        }
    }
}

module.exports = {NodeGame, NodeGamePure}