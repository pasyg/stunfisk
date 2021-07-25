const { stringify } = require("querystring")

function rand(a, b) {
    return a + (b-a) * Math.random()
}

function sample(A) {
    return A[Math.floor(rand(0, A.length))]
}

class TwoPlayerPureTree {

    constructor () {

        this.name
        this.payoffs
        this.depth
        this.actions = [[], []]
        this.matrix
        this.equilibrium

    }

    expand(payoffs, depth, actions=[[0,1]], name='|') {

        this.name = name
        this.payoffs = payoffs

        if (depth === 0) return

        this.actions = this.actions.map(A => sample(actions))
        const equilibrium = this.actions.map(A => sample(A))
        this.equilibrium = equilibrium
        this.matrix = this.actions[0].map(a => this.actions[1].map(b => new TwoPlayerPureTree()))

        for (const a of this.actions[0]) {
            for (const b of this.actions[1]) {
                let lower = -1
                let upper = 1
                if (a === equilibrium[0]) lower = this.payoffs[0]
                if (b === equilibrium[1]) upper = this.payoffs[0]
                const u = rand(lower, upper)
                ;(this.matrix[a][b]).expand([u, -u], depth - 1, actions, name+`${a}${b}|`)
            }
        }
    }

    check() {
        console.log(this.name, this.payoffs)
        for (const a of this.actions[0]) {
            for (const b of this.actions[1]) {
                ;(this.matrix[a][b]).check()
            }
        }
    }

    apply(tuple) {
        const get = this.matrix[tuple[0]][tuple[1]]
        return [get, 0]
    }

    rollout(){
        if (this.actions.every(A => A.length > 0)) {
            const tuple = this.actions.map(A => sample(A))
            let [state, hash] = this.apply(tuple)
            return state.rollout()
        } else {
            return this.payoffs
        }
    }

}

if (false) {
    let state = new TwoPlayerPureTree()
    state.expand(payoffs=[1,-1], depth=2)
    state.check()
}

module.exports = {TwoPlayerPureTree}