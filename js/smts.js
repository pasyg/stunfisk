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
//Search encloses the vanilla SM-MCTS-A algorithm from arXiv:1804.09045 [cs.GT]
//It includes some basic helper functions, which may be used elsewhere
//meant to be performant; i dont currently see a way to optimize this, nor a reason really
class Search { 
    constructor(){}
    add(x, y){for(let i = 0; i < y.length; ++i) x[i] += y[i]; return x}
    mul(a, x){for(let i = 0; i < x.length; ++i) x[i] *= a; return x}
    normalizedPositive(array, epsilon=10**-3){
        let sum = 0
        const n = array.length
        const result = new Array(n)
        for (let i = 0; i < n; ++i){
            const x = Math.max(array[i], 0) + epsilon
            result[i] = x
            sum += x
        }
        this.mul(1/sum, result)
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
    updateRegrets(dnode, i, j, u){
        const n = dnode.regret1.length
        for (let a = 0; a < dnode.regret0.length; ++a){
            if (a === i) continue
            const chance = dnode.chance[a*n+j]
            dnode.regret0[a] += chance.X / (chance.n + (chance.n === 0)) - u
        }
        for (let b = 0; b < n; ++b){
            if (b === j) continue
            const chance = dnode.chance[i*n+b]
            dnode.regret1[b] += u - chance.X / (chance.n + (chance.n === 0))
        }
    }
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
        const i = this.sampleNormalized(strategy0)
        const j = this.sampleNormalized(strategy1)
        const cnode = dnode.chance[i*n+j]
        const [state_, hash] = state.transition(i, j)
        const dnode_ = this.accessChance(cnode, hash)
        const u = this.run(dnode_, state_)
        const u_ = cnode.X / (cnode.n + (cnode.n === 0))
        this.updateRegrets(dnode, i, j, u_)
        this.add(dnode.strategy0, strategy0)
        this.add(dnode.strategy1, strategy1)
        cnode.X += u
        cnode.n += 1
        return u
    }
}
//ExtraSearch encloses functions for testing and analysis
class ExtraSearch extends Search{
    constructor(){
        super()
    }
    expandNodeGame(state){
        state.action0 = state.actions[0].slice()
        state.action1 = state.actions[1].slice()
        const m = state.action0.length
        const n = state.action1.length
        state.regret0 = new Array(m)
        state.regret1 = new Array(n)
        state.strategy0 = new Array(m)
        state.strategy1 = new Array(n)
        for (let i = 0; i < m; ++i){
            state.regret0[i] = 0
            state.strategy0[i] = 0
        }
        for (let j = 0; j < n; ++j){
            state.regret1[j] = 0
            state.strategy1[j] = 0
        }   
    }
    run(state, lambda=.1){
        if(state.action0 === null){
            this.expandNodeGame(state)
            return state.rollout()
        }
        const m = state.action0.length
        const n = state.action1.length
        if(m === 0 | n === 0){
            return state.rollout()
        }
        const strategy0 = this.add(this.mul((1-lambda), this.normalizedPositive(state.regret0)), state.action0.map(x=>lambda/m))
        const strategy1 = this.add(this.mul((1-lambda), this.normalizedPositive(state.regret1)), state.action1.map(x=>lambda/n))
        const i = this.sampleNormalized(strategy0)
        const j = this.sampleNormalized(strategy1)
        const cnode = state.chance[i*n+j]
        const state_ = state.transition(i, j)[0] //hash func
        const u = this.run(state_)
        const u_ = cnode.X / (cnode.n + (cnode.n === 0))
        this.updateRegrets(state, i, j, u_)
        this.add(state.strategy0, strategy0)
        this.add(state.strategy1, strategy1)
        cnode.X += u
        cnode.n += 1
        state.matrixChance[i][j] = cnode.X / cnode.n
        return u
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
    updateRegrets(state, i, j, u){
        const n = state.regret1.length
        for (let a = 0; a < state.regret0.length; ++a){
            if (a === i) continue
            state.regret0[a] += state.matrix[a][j] - u
        }
        for (let b = 0; b < n; ++b){
            if (b === j) continue
            state.regret1[b] += u - state.matrix[i][b]
        }
    }
    removeUniformNoise(strategy, lambda){
        const m = strategy.length
        const strategyClean = strategy.map(p=>p-lambda/m)
        this.mul(1/(1-lambda), strategyClean)
        return strategyClean
    }
    /*

    norm(array, epsilon=10**-3){
        let sum = 0
        const n = array.length
        const result = new Array(n)
        for (let i = 0; i < n; ++i){
            const x = Math.abs(array[i])
            result[i] = x
            sum += x
        }
        for (let i = 0; i < n; ++i){
            result[i] /= (sum + epsilon)
        }
        return result
    }

    regretMatchEpsilon(M, regret0, regret1, epsilon){
        const m = regret0.length
        const n = regret1.length
        const r0 = regret0.map(x=>0)//probably necesssary to seed regrets
        const r1 = regret1.map(x=>0)
        const s0 = regret0.map(x=>0)
        const s1 = regret1.map(x=>0)
        let i = 0
        for(;i<10**9;++i){
            const t0 = this.normalizedPositive(r0)
            const t1 = this.normalizedPositive(r1)
            const j0 = this.sampleNormalized(t0)
            const j1 = this.sampleNormalized(t1)
            const u = M[j0][j1]
            const r_ = this.getR(M, j0, j1, m, n, u)
            this.add(r0, r_[0])
            this.add(r1, r_[1])
            this.add(s0, t0)
            this.add(s1, t1)
            if(Math.floor(Math.log(i+6)/Math.log(2)) !== Math.floor(Math.log(i+5)/Math.log(2))){
                const s0_ = this.normalizedPositive(s0)
                const s1_ = this.normalizedPositive(s1)
                const e = this.exploitability(M, s0_, s1_)
                if(e < epsilon){
                    return [this.norm(r0), this.norm(r1), s0_, s1_, i]
                }
            }
        }
        const s0_ = this.normalizedPositive(s0)
        const s1_ = this.normalizedPositive(s1)
        return [this.norm(r0), this.norm(r1), s0_, s1_, i]
    }

    runNE(dnode, state, epsilon){
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
        const [r0, r1, s0, s1, i] = this.regretMatchEpsilon(state.M_estimate, dnode.regret0, dnode.regret1, epsilon)
        this.add(dnode.regret0, r0)
        this.add(dnode.regret1, r1)
        this.add(dnode.strategy0, s0)
        this.add(dnode.strategy1, s1)
        cnode.X += u
        cnode.n += 1
        state.M_estimate[a][b] = cnode.X/cnode.n
        return u
    }*/
}

const search = new Search()
const dnode = new DecisionNode()
const state = {actions : [[0,1,2,3,4,5,6,7,8], [0,1,2,3,4,5,6,7,8]]}
search.expandDecision(dnode, state)

module.exports = {Search, DecisionNode, ChanceNode, ExtraSearch}