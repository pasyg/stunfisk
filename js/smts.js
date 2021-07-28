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
    accumulate(x, y){for(let i = 0; i < y.length; ++i) x[i] += y[i]}

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

    expandDecision(dnode, state){
        dnode.action0 = state.actions[0].slice()
        dnode.action1 = state.actions[1].slice()
        const m = dnode.action0.length
        const n = dnode.action1.length
        dnode.regret0 = new Array(m)
        dnode.regret1 = new Array(n)
        dnode.strategy0 = new Array(m)
        dnode.strategy1 = new Array(n)

        //dnode.chance = new Array(m*n)
        for (let i = 0; i < m; ++i){
            dnode.regret0[i] = 0
            dnode.strategy0[i] = 0
            //for (let j = 0; j < n; ++j){
            //    dnode.chance[i*n+j] = new ChanceNode()
            //}
        }
        for (let i = 0; i < n; ++i){
            dnode.regret1[i] = 0
            dnode.strategy1[i] = 0
        }   
    }

    calculateRegrets(dnode, a, b, m, n, u){
        const column = new Array(m)
        const row = new Array(n)
        for (let i = 0; i < m; ++i){
            const chance = dnode.chance[i*n+b]
            column[i] = chance.X / (chance.n + (chance.n === 0)) - u
        }
        for (let j = 0; j < n; ++j){
            const chance = dnode.chance[a*n+j]
            row[j] = u - chance.X / (chance.n + (chance.n === 0))
        }
        column[a] = 0
        row[b] = 0
        return [column, row]
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
            return state.rollout()
        }
        const m = dnode.action0.length
        const n = dnode.action1.length
        if(m === 0 | n === 0){
            return state.rollout()
        }
        const strategy0 = this.normalizedPositive(dnode.regret0)
        const strategy1 = this.normalizedPositive(dnode.regret1)
        const a = this.sampleNormalized(strategy0)
        const b = this.sampleNormalized(strategy1)
        const cnode = dnode.chance[a * n + b]
        const [state_, hash] = state.transition(a, b)
        const dnode_ = this.accessChance(cnode, hash)
        const u = this.run(dnode_, state_)
        const u_ = cnode.X / (cnode.n + (cnode.n === 0))
        const [regret0, regret1] = this.calculateRegrets(dnode, a, b, m, n, u_)
        this.accumulate(dnode.regret0, regret0)
        this.accumulate(dnode.regret1, regret1)
        this.accumulate(dnode.strategy0, strategy0)
        this.accumulate(dnode.strategy1, strategy1)
        cnode.X += u
        cnode.n += 1
        return u
    }
}

class ExtraSearch extends Search{
    constructor(){
        super()
    }

    exploitability(M, A, B){
        const m = A.length
        const n = B.length
        const best0 = new Array(m)
        const best1 = new Array(n)
        for (let i = 0; i < m; ++i) best0[i] = 0
        for (let j = 0; j < n; ++j) best1[j] = 0
        
        for (let i = 0; i < m; ++i){
            for (let j = 0; j < n; ++j){
                const p = A[i]
                const q = B[j]
                const u = M[i][j]
                best0[i] += u * q
                best1[j] -= u * p
            }
        }
        return Math.max(...best0) + Math.max(...best1)
    }

    runAverage(dnode, state, id=[1,0]){ //Options for all 4 placements of u and u_. Vanilla SM-MCTS-A is the default configuration.
        if(dnode.action0 === null){
            this.expandDecision(dnode, state)
            return state.rollout()
        }
        const m = dnode.action0.length
        const n = dnode.action1.length
        if(m === 0 | n === 0){
            return state.rollout()
        }
        const strategy0 = this.normalizedPositive(dnode.regret0)
        const strategy1 = this.normalizedPositive(dnode.regret1)
        const a = this.sampleNormalized(strategy0)
        const b = this.sampleNormalized(strategy1)
        const cnode = dnode.chance[a * n + b]
        const [state_, hash] = state.transition(a, b)
        const dnode_ = this.accessChance(cnode, hash)
        const u = this.run(dnode_, state_)
        const u_ =  cnode.X / (cnode.n + (cnode.n === 0))
        const u__ = [u, u_]
        const [regret0, regret1] = this.calculateRegrets(dnode, a, b, m, n, u__[id[0]])
        this.accumulate(dnode.regret0, regret0)
        this.accumulate(dnode.regret1, regret1)
        this.accumulate(dnode.strategy0, strategy0)
        this.accumulate(dnode.strategy1, strategy1)
        cnode.X += u
        cnode.n += 1
        return u__[id[1]]
    }

}

module.exports = {Search, DecisionNode, ChanceNode, ExtraSearch}