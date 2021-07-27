const SMTS = require("./SMTS")
const tf = require('@tensorflow/tfjs-node')
const { math, node } = require("@tensorflow/tfjs-node")



class NodeTree extends SMTS.DecisionNode {
    constructor(){
        super()
        this.value = null
        this.actions = null
        this.M = null
        this.name = null
    }

    expand(value, depth, actions, name=""){
        this.value = value
        this.actions = [[], []]
        this.name = name
        if (depth === 0) {
            return
        }
        this.actions = this.actions.map(A => actions[Math.floor(Math.random()*actions.length)])
        let shape = this.actions.map(A => A.length)
        this.chance = new Array(shape[0] * shape[1])
        this.M = this.actions[0].map(a => new Array(shape[1]))
        const index = shape.map(x => Math.floor(Math.random() * x))
        for (let i = 0; i < shape[0]; ++i){
            for (let j = 0; j < shape[1]; ++j){
                let lower = -1
                let upper = 1
                if (i == index[0]) lower = value
                if (j == index[1]) upper = value
                const v = lower + (upper - lower) * Math.random()
                this.M[i][j] = v
                const cnode = new SMTS.ChanceNode()
                cnode.hash = [0]
                cnode.decision = [new NodeTree()]
                cnode.decision[0].expand(v, depth-1, actions, name + `{${i}#${j}}`)
                this.chance[i * shape[1] + j] = cnode
            }
        }
        this.M = tf.tensor(this.M)
    }

    transition(a, b){
        const n = this.actions[1].length
        return [this.chance[a*n + b].decision[0], 0]
    }

    rollout(){
        if (this.actions[0].length === 0){
            return this.value
        }
        const a = Math.floor(Math.random() * this.actions[0].length)
        const b = Math.floor(Math.random() * this.actions[1].length)
        return this.transition(a, b)[0].rollout()
    }

    ping(){
        if (this.M === null) return
        console.log(this.name)
        this.M.print()
        for (const cnode of this.chance) cnode.decision[0].ping()
    }

    reset(){
        this.action0 = null
        this.action1 = null
        this.regret0 = null
        this.regret1 = null
        this.strategy0 = null
        this.strategy1 = null
        for (const cnode of this.chance) {
            cnode.X = 0
            cnode.n = 0
            cnode.decision[0].reset()
        }
    }

}

module.exports = {NodeTree}