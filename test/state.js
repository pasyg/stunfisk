class State {

    constructor(a=[[0,1], [0,1]], terminal=null){
        this.a = a
        this.terminal = terminal
    }
    //please dont look xD
    apply(sample){
        let reward
        let sampleKey = 2*sample[0] + sample[1] //0-8
        switch (sampleKey) { 
            case 0:
                reward = [0,0]
                return [new State([[], []], reward), 0]
            case 1:
                reward = [-1,1]
                return [new State([[], []], reward), 0]
            case 2:
                reward = [-1,1]
                return [new State([[], []], reward), 0]   
            case 3:
                reward = [1,-1]
                return [new State([[], []], reward), 0]
            default:
                console.log('!!')
        }
    }

    rollout(){
        if (this.a.every(A => A.length > 0)) {
            const sample = this.a.map(A => A[Math.floor(Math.random() * A.length)])
            let [state, hash] = this.apply(sample)
            return state.rollout()
        } else {
            return this.terminal
        }
    }

    actions(){
        return this.a
    }

}

class MatrixGame {

    constructor (players=2) {
        this.rewards
    }

}

class PureTree {

    constructor (value, depth=1, actions=[[0, 1]]) {

        this.actions = [[],[]].map(A => actions[Math.floor(Math.random() * actions.length)])
        NEIndex = this.actions.map(A => A[Math.floor(Math.random() * A.length)])

    }


}

module.exports = {State, PureTree}