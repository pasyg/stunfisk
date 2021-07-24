const { nextToken } = require('sucrase/dist/parser/tokenizer')
let State = require('./state')

class DecisionNode { //BIG TODO : SPEED TEST ALL THIS CUTE ONE LINER SHIT

    constructor(){
        this.expanded = false
        this.actions = []
        this.regrets = []
        this.strategies = []
        this.chances = new Map()
        this.terminal = null
    }

}

class ChanceNode {

    constructor(X){
        this.X = X
        this.n = 0
        this.decisions = new Map()
    }

}

class Search {

    constructor(){}

    expandDecision(dNode, state){
        dNode.actions = state.actions()
        dNode.regrets = dNode.actions.map(A => A.map(a => 0))
        dNode.strategies = dNode.actions.map(A => A.map(a => 0))
        dNode.chances = new Map()
        for (let actionTuple of cartesian(dNode.actions)) dNode.chances.set(arrayToInt(actionTuple), new ChanceNode(dNode.actions.map(A => 0)))
        dNode.expanded = true
        dNode.terminal = state.rollout()
    }

    getStrategy(dNode){
        let epsilon = 10**-3
        let strategies = dNode.regrets.map(regret => regret.map(r => Math.max(epsilon, r)))
        let norms = strategies.map(regret => regret.reduce((a, b) => a + b, 0))
        strategies = strategies.map((regret, p) => regret.map(r => r/norms[p]))
        return strategies
    }

    accessChance(cNode, hash) {
        let dNode = cNode.decisions.get(hash)
        if (dNode === undefined) {
            dNode = new DecisionNode()
            cNode.decisions.set(hash, dNode)
        }
        return dNode
    }

    expectedScore(cNode){
        return cNode.X.map(x => x / (cNode.n === 0 ? 1 : cNode.n))
    }

    getRegrets (dNode, sample, reward) {
        let regrets = []
        for (const p in dNode.actions) {
            let regret = []
            let u = reward[p]
            for (const tuple of counterfact(sample, p, dNode.actions[p].length)) {
                let v = this.expectedScore(dNode.chances.get(arrayToInt(tuple)))[p]
                regret.push(v - u)
            }
            regret[sample[p]] = 0
            regrets.push(regret)
        }
        return regrets
    }

    sampleActions (strategies, gamma) {
        return strategies.map(function (strategy){
            let seed = Math.random()
            for (const i in strategy){
                seed -= strategy[i]
                if (seed <= 0) return i
            }
            return strategy.length - 1
        })
    }

    getMoves (dNode, sample) {
        return sample.map((i, p) => dNode.actions[p][i])
    }

    updateDecision (dNode, regrets, strategies) {
        for (const p in regrets){
            const regret = regrets[p]
            for (const a in regret) {
                dNode.strategies[p][a] += strategies[p][a]
                dNode.regrets[p][a] += regret[a]
            }
        }
    }

    updateChance (cNode, u) {
        cNode.n += 1
        for (const p in u) {
            cNode.X[p] += u[p]
        }
    }

    averageStrategies(dNode){
        const norms = dNode.strategies.map(strategy => strategy.reduce((a, b) => a + b, 0))
        return dNode.strategies.map((strategy, p) => strategy.map(s => s/(norms[p] === 0 ? 1 : norms[p])))
    }

    averageRegrets(dNode){
        const norms = dNode.regrets.map(regret => regret.reduce((a, b) => Math.abs(a + b), 0))
        return dNode.regrets.map((regret, p) => regret.map(r => r/(norms[p] === 0 ? 1 : norms[p])))
    }

    run(dNode, state, gamma=0, info={depth:0, terminal:false}){

        if (!dNode.expanded) {
            this.expandDecision(dNode, state)
            return dNode.terminal
        }

        if (dNode.actions.some(A => A.length === 0)){
            info.terminal = true
            return dNode.terminal
        }
        const strategies = this.getStrategy(dNode)

        const sample = this.sampleActions(strategies, gamma)

        const moves = this.getMoves(dNode, sample)

        const cNode = dNode.chances.get(arrayToInt(sample))

        const [state_, hash] = state.apply(moves)

        const dNode_ = this.accessChance(cNode, hash)

        info.depth += 1

        const u = this.run(dNode_, state_, gamma, info)

        const regrets = this.getRegrets(dNode, sample, u)

        this.updateDecision(dNode, regrets, strategies)

        this.updateChance(cNode, u)
        
        return this.expectedScore(cNode)

    }

    exploitability (dNode) {
        let total = 0
        const mixed = dNode.actions.map(A => 0)
        const pure = dNode.actions.map(A => A.map(_ => 0))
        const x = this.averageStrategies(dNode)

        for (const tuple of cartesian(dNode.actions)){
            const probs = tuple.map((i, p) => x[p][i])
            const rewards = this.expectedScore(dNode.chances.get(arrayToInt(tuple)))
            const product = probs.reduce((p, q) => p*q, 1)
            for (const p in dNode.actions) {
                const u = rewards[p]
                pure[p][tuple[p]] += u * (probs[p] ? product / probs[p] : probs.filter((_, __) => __ !== p).reduce((p, q) => p*q, 1))
                mixed[p] += u * product 
            }
        }
        for (const p in dNode.actions) {
            const best = Math.max(...pure[p])
            const r = best - mixed[p]
            total += r
        }
        return total
    }

}

function* cartesian(arrayOfArrays) {
    if (arrayOfArrays.length === 0) {
        yield [];
    } else {
        for (let _ of arrayOfArrays[0]) for (__ of cartesian(arrayOfArrays.slice(1)))  yield [_, ...__]
    }
}

function* counterfact(sample, p, max) {
    copy = sample.slice()
    for (let i = 0; i < max; ++i) {
        copy[p] = i
        yield copy
    }
}

function arrayToInt(arr, base=2**2) {
    return arr.map((x, index) => (x % base) * base**index).reduce((a, b) => a + b, 0)
}

let n = 1
let sum = 0
for (let i = 0; i < n; ++i){
    let search = new Search()
    let state = new State.State()
    let dNode = new DecisionNode()
    search.run(dNode, state)
    let k = 500
    for (let j = 0; j < 2**15; ++j) {
        if (j%k == 0){
            console.log(dNode.regrets)
        }
        search.run(dNode, state)
    }
    sum += search.exploitability(dNode)
    console.log(search.averageRegrets(dNode))
    console.log(dNode.regrets)
    console.log(search.averageStrategies(dNode))
}
console.log(sum/n)