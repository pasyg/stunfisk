class DecisionNode { 
    constructor(){
        this.action0 = null
        this.action1 = null
        this.regret0 = null
        this.regret1 = null
        this.strategy0 = null
        this.strategy1 = null
        this.chance = null
    }
}

class ChanceNode {
    constructor(){
        this.X = 0
        this.n = 0
        this.hash = new Array()
        this.decision = new Array()
    }
}

class Search {
    constructor(){}
    expandDecision(dnode, state){
        dnode.action0 = state.actions[0]
        dnode.action1 = state.actions[1]
        const m = dnode.action0.length
        const n = dnode.action1.length
        dnode.regret0 = new Array(m)
        dnode.regret1 = new Array(n)
        dnode.strategy0 = new Array(m)
        dnode.strategy1 = new Array(n)
        dnode.chance = new Array(m*n)
        for (let i = 0; i < m; ++i){
            dnode.regret0[i] = 0
            dnode.strategy0[i] = 0
            for (let j = 0; j < n; ++j){
                dnode.chance[i*n+j] = new ChanceNode()
            }
        }
        for (let i = 0; i < n; ++i){
            dnode.regret1[i] = 0
            dnode.strategy1[i] = 0
        }   
    }

    normalizedPositive(array, epsilon=10**-3){
        let sum = 0
        const n = array.length
        const result = new Array(n)
        for (let i = 0; i < n; ++i){
            const x = Math.max(array[i], epsilon)
            result[i] = x
            sum += x
        }
        for (let i = 0; i < n; ++i){
            result[i] /= sum
        }
        return result
    }

    sampleNormalized(array){
        let seed = Math.random()
        for (let i = 0; i < array.length; ++i) {
            seed -= array[i]
            if (seed < 0) return i
        }
    }

    accessChance(cnode, hash){
        for(let i = 0; i < cnode.hash.length; ++i){
            if(cnode.hash[i] === hash){
                return cnode.decision[i]
            }
        }
        const dnode = new DecisionNode()
        cnode.hash.push(hash)
        cnode.decision.push(dnode)
        return dnode
    }
    /*
    accessChance(cnode, hash){
        let dnode = cnode.decision.get(hash)
        if(dnode === undefined){
            dnode = new DecisionNode()
            cnode.decision.set(hash, dnode)
        }
        return dnode
    }*/
    run(dnode, state){
        if(dnode.action0 === null){
            this.expandDecision(dnode, state)
            return state.rollout
        }
        const m = dnode.action0.length
        const n = dnode.action1.length
        if(m === 0 | n === 0){
            return state.rollout
        }

        const strategy0 = this.normalizedPositive(dnode.regret0)
        const strategy1 = this.normalizedPositive(dnode.regret1)
        const a = this.sampleNormalized(strategy0)
        const b = this.sampleNormalized(strategy1)
        const cnode = dnode.chance[a * n + b]
        this.accessChance(cnode, 0)
        //console.log('!')
    }
}

module.exports = {Search, DecisionNode, ChanceNode}