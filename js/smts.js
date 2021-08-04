class DecisionNode { 
    constructor(){
        this.action0 = null
        this.action1 = null
        this.regret0 = null
        this.regret1 = null //check if late initialization is slower because of fragmentation or smth idk
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
    add(x, y){for(let i = 0; i < y.length; ++i) x[i] += y[i]; return x}
    add_(a, x){for(let i = 0; i < x.length; ++i) x[i] += a; return x}
    mul(a, x){for(let i = 0; i < x.length; ++i) x[i] *= a; return x}
    normalizedPositive(array){
        let sum = 0
        const n = array.length
        const result = new Array(n)
        for (let i = 0; i < n; ++i){
            const x = Math.max(array[i], 0)
            result[i] = x
            sum += x
        }
        if (sum === 0) return result
        this.mul(1/sum, result)
        return result
    }
    sampleNormalized(array){
        let seed = Math.random()
        for (let i = 0; i < array.length; ++i) {
            seed -= array[i]
            if (seed < 0) return i
        }
        return 0
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
    removeUniformNoise(strategy, lambda){
        const m = strategy.length
        const strategyClean = strategy.map(p=>p-lambda/m)
        this.mul(1/(1-lambda), strategyClean)
        return strategyClean
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
    run(dnode, state, select, update, lambda){
        if (dnode.action0 === null){
            this.expandDecision(dnode, state)
            return state.rollout()
        }
        const m = state.action0.length
        const n = state.action1.length
        if(m === 0 || n === 0){
            return state.rollout()
        }
        const strategy0 = select(dnode.regret0, m, lambda)
        const strategy1 = select(dnode.regret1, n, lambda)
        const i = this.sampleNormalized(strategy0)
        const j = this.sampleNormalized(strategy1)
        const cnode = dnode.chance[i*n+j]
        cnode.n += 1
        const [state_, hash] = state.transition(i, j)
        const dnode_ = this.accessChance(cnode, hash)
        const u = this.run(dnode_, state_, select, update)
        const u_ = cnode.X/cnode.n
        update(dnode.regret0, strategy0, i,  u_)
        update(dnode.regret1, strategy1, j, -u_)
        this.add(dnode.strategy0, strategy0)
        this.add(dnode.strategy1, strategy1)
        cnode.X += u
        return u
    }
    selectRegretMatch(regret, k, lambda){
        let sum = 0
        const strategy = new Array(k)
        for (let i = 0; i < k; ++i){
            const x = Math.max(regret[i], 0)
            strategy[i] = x
            sum += x
        }
        if (sum === 0) return regret.map(r=>1/k)
        const padded = new Array(k)
        for (let i = 0; i < k; ++i) {
            padded[i] = (1-lambda)*strategy[i]/sum + (lambda)/k
        }
        return padded
    }
    selectEXP3(regret, k, lambda){
        let sum = 0
        const strategy = new Array(k)
        const max = Math.max(...regret) //speedtest this, do it loser
        for (let i = 0; i < k; ++i){
            const x = Math.exp((regret[i]-max)*lambda/k)
            strategy[i] = x
            sum += x
            if (regret[i] > max) max = regret[i]
        }
        const padded = new Array(k)
        for (let i = 0; i < k; ++i) {
            padded[i] = (1-lambda)*strategy[i]/sum + (lambda)/k 
        }
        return padded
    }
    updateRegretMatch(regret, strategy, i, u){
        for (let a = 0; a < regret.length; ++a){
            regret[a] -= u
        }
        regret[i] += u/strategy[i]
    }
    updateEXP3(regret, strategy, i, u){
        regret[i] += u/strategy[i]
    }
}
class NodeGameSearch extends Search{
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
    run(state, select, update, lambda){
        if (state.action0 === null) {
            this.expandNodeGame(state)
            return state.rollout()
        }
        const m = state.action0.length
        const n = state.action1.length
        if(m === 0 || n === 0){
            return state.rollout()
        }
        const strategy0 = select(state.regret0, m, lambda)
        const strategy1 = select(state.regret1, n, lambda)
        const i = this.sampleNormalized(strategy0)
        const j = this.sampleNormalized(strategy1)
        const cnode = state.chance[i*n+j]
        cnode.n += 1
        const state_ = state.transition(i, j)[0]
        const u = this.run(state_, select, update, lambda)
        const u_ = cnode.X/cnode.n
        update(state.regret0, strategy0, i,  u_)
        update(state.regret1, strategy1, j, -u_)
        this.add(state.strategy0, strategy0)
        this.add(state.strategy1, strategy1)
        cnode.X += u
        return u
    }
    runTimer(state, select, update, lambda, seconds){
        const startTime = Date.now();
        let sim = 0
        while ((Date.now() - startTime) < seconds*1000) {
            this.run(state, select, update, lambda)
            ++sim
        }
        const strategy0 = this.normalizedPositive(state.strategy0, 0)
        const strategy1 = this.normalizedPositive(state.strategy1, 0)
        const s0 = this.removeUniformNoise(strategy0, lambda) //rUN works here
        const s1 = this.removeUniformNoise(strategy1, lambda)
        const expl = this.exploitability(state.matrix, s0, s1)
        const e = this.exploitability(state.matrix, strategy0, strategy1)
        return [s0, s1, expl, e, sim]
    }
}

module.exports = {Search, DecisionNode, ChanceNode, NodeGameSearch}