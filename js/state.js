const SMTS = require("./SMTS")

//This class behaves as both the State and the DecisionNode
//This duality is mostly for convenience, but we must store the de facto tree information somewhere
class NodeGame extends SMTS.DecisionNode {
    constructor(){
        super()
        this.value = null
        this.actions = null
        this.matrix = null
        this.matrixChance = null
        this.id = null
    }
    initialize(value, depth, actions, depthDecrement=[1], id='{}'){
        this.value = value
        this.actions = [[], []]
        this.id = id
        if (depth <= 0) return
        this.actions = this.actions.map(A => actions[Math.floor(Math.random()*actions.length)])
        let shape = this.actions.map(A => A.length)
        this.chance = new Array(shape[0] * shape[1])
        this.matrix = this.actions[0].map(a => new Array(shape[1]))
        this.matrixChance = this.actions[0].map(a => this.actions[1].map(_=>0))
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
                this.chance[i * shape[1] + j] = cnode //used to be last!!!
                cnode.hash = [0]
                cnode.decision = [new NodeGame()]
                cnode.decision[0].initialize(
                    v,
                    depth-depthDecrement[Math.floor(Math.random()*depthDecrement.length)],
                    actions,
                    depthDecrement,
                    id + `{${i}#${j}}`)
            }
        }
    }
    transition(a, b){
        const n = this.actions[1].length
        return [this.chance[a*n + b].decision[0], 0]
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
        console.log(this.id)
        console.log(this.matrix)
        console.log(this.matrixChance, '\n')
        return true
    }
    printTree(){
        if (this.print()) for (const cnode of this.chance) cnode.decision[0].printTree() //extend hash functionallity 
    }
    resetSearchStats(){
        if(this.chance === null) return
        this.action0 = null
        this.action1 = null
        this.regret0 = null
        this.regret1 = null
        this.strategy0 = null
        this.strategy1 = null
        this.matrixChance = this.actions[0].map(a => this.actions[1].map(_=>0))
        for (const cnode of this.chance) {
            cnode.X = 0
            cnode.n = 0
            for (const dnode of cnode.decision) dnode.resetSearchStats()
        }
    }
}

const state = new NodeGame()
state.initialize(0, 5, [[0,1,2,3]], [1])
console.log(state.count())
const search = new SMTS.ExtraSearch()
let lambda = .5
for(let i=0;i<10**6;++i) search.run(state, lambda)
const [A, B] = [state.strategy0, state.strategy1].map(s=>search.normalizedPositive(s, 0))
const [A_, B_] = [state.strategy0, state.strategy1].map(s=>search.removeUniformNoise(search.normalizedPositive(s, 0), lambda))

console.log(state.matrix)
console.log(search.exploitability(state.matrix, A, B))
console.log(search.exploitability(state.matrix, A_, B_))

module.exports = {NodeGame}