"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _randomteams = require('./pokemon-showdown-master/.data-dist/mods/gen4/random-teams');

var _dex = require('./pokemon-showdown-master/.sim-dist/dex');

 class RandomGen3Teams extends _randomteams.default {
	
	constructor(format, prng) {
		super(format, prng);
		this.battleHasDitto = false;
		this.battleHasWobbuffet = false;
		this.moveEnforcementCheckers = {
			Bug: (movePool, moves, abilities, types, counter, species) => (
				movePool.includes('megahorn') || (!species.types[1] && movePool.includes('hiddenpowerbug'))
			),
			Electric: (movePool, moves, abilities, types, counter) => !counter.get('Electric'),
			Fighting: (movePool, moves, abilities, types, counter) => !counter.get('Fighting'),
			Fire: (movePool, moves, abilities, types, counter) => !counter.get('Fire'),
			Ground: (movePool, moves, abilities, types, counter) => !counter.get('Ground'),
			Normal: (movePool, moves, abilities, types, counter) => !counter.get('Normal') && counter.setupType === 'Physical',
			Psychic: (movePool, moves, abilities, types, counter, species) => (
				types.has('Psychic') &&
				(movePool.includes('psychic') || movePool.includes('psychoboost')) &&
				species.baseStats.spa >= 100
			),
			Rock: (movePool, moves, abilities, types, counter, species) => !counter.get('Rock') && species.baseStats.atk >= 100,
			Water: (movePool, moves, abilities, types, counter, species) => (
				!counter.get('Water') && counter.setupType !== 'Physical' && species.baseStats.spa >= 60
			),
			// If the Pokémon has this move, the other move will be forced
			protect: movePool => movePool.includes('wish'),
			sunnyday: movePool => movePool.includes('solarbeam'),
		};
	}

	randomItem() {
		const validItems = [
		'Aguav Berry',  'Apicot Berry', 'Aspear Berry',   
		'Cheri Berry',  'Chesto Berry',   'Choice Band',
		'Deep Sea Scale', 'Deep Sea Tooth',

		'Figy Berry',   'Ganlon Berry',  
		'Iapapa Berry',    
		'Lax Incense',  'Leppa Berry',  'Liechi Berry',   'Lum Berry',
		'Macho Brace',  'Mago Berry',     
		'Mental Herb',    
		'Oran Berry',     
		'Pecha Berry',  'Persim Berry', 'Petaya Berry',  

		'Rawst Berry',         
		'Salac Berry',  'Sea Incense',  'Shell Bell',     'Silk Scarf',
		'Sitrus Berry',        'Starf Berry',
		
		'White Herb',   'Wiki Berry',
		'Pokeball', '',
		];
		return validItems[validItems.length * Math.random() << 0];
	}

	randomNature(){
		return _dex.Dex.natures.all().map(x => x.name)[25 * Math.random() << 0];
	}

	randomInt(min , max ) {
		const num = Math.floor(Math.random() * (max - min + 1)) + min;
		return num;
	}
	  
	randomEVSample() {
		let evs = [];
		for(let i = 0; i < 6; ++i){
			evs.push(this.randomInt(0, 63));
		}
		return evs;
	}

	validateEVs(evs ){
		return evs.every(x => (x < 64)) && evs.reduce((a, b) => a + b) < 128;
	}

	randomEVs(){
		for(let i = 0; i < 100; ++i){
			let evs = this.randomEVSample();
			if (this.validateEVs(evs)) {
				return {hp: evs[0]*4, atk: evs[1]*4, def: evs[2]*4, spa: evs[3]*4, spd: evs[4]*4, spe: evs[5]*4};
			}
		}
		return {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85};
	}

	extantMoves(learnset ){
		let movepool = [];
		for (const [moveid, value] of Object.entries(learnset)) {
			if (value.filter((x ) => parseInt(x[0]) <= 3).length > 0){
				movepool.push(moveid);
			}
		}
		return movepool;
	}

	randomSet(species, teamDetails = {}) {
		species = this.dex.species.get(species);
		let forme = species.name;
		if (typeof species.battleOnly === 'string') forme = species.battleOnly;

		const evs = this.randomEVs();
		const ivs = {hp: this.randomInt(0, 31), 
			atk: this.randomInt(0, 31), 
			def: this.randomInt(0, 31),
			spa: this.randomInt(0, 31), 
			spd: this.randomInt(0, 31),
			spe: this.randomInt(0, 31)};
		
		var forceMoves = teamDetails.forceMoves ? teamDetails.forceMoves : []
		let movePool = this.extantMoves(this.dex.data.Learnsets[species.id].learnset);
		const moves = new Set(forceMoves);
		while (moves.size < 4 && movePool.length) {
			const moveid = this.sampleNoReplace(movePool);
			moves.add(moveid);
		}

		const abilities = new Set(Object.values(species.abilities));
		const abilityData = Array.from(abilities).map(a => this.dex.abilities.get(a)).filter(a => a.gen === 3);
		let ability0 = abilityData[0];
		let ability1 = abilityData[1];
		if (abilityData[1]) {
			if (this.randomChance(1, 2)){
				[ability0, ability1] = [ability1, ability0];
			}
		}
		const ability = ability0.name;

		const item = this.randomItem();

		let level = this.randomInt(5, 100);

		return {
			name: species.baseSpecies,
			species: forme,
			gender: species.gender,
			moves: Array.from(moves),
			ability: ability,
			nature: this.randomNature(),
			evs: evs,

			ivs: ivs,
			item: item,
			level,
			shiny: false
		};
	}

	randomTeam() {
		const seed = this.prng.seed;
		const pokemon = [];
		const forceMons  = []

		// For Monotype
		const isMonotype = false;
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		const baseFormes = {};

		const pokemonPool = this.getPokemonPool(type, pokemon, isMonotype);

		const sizeProb = [374, 69751, 8649124, 802206251, 59363262574, 3650840648301]
		var sizeSeed = this.randomInt(0, sizeProb.reduce((a, b) => a + b, 0));
		var teamSize = 1;
		for(var i = 0; i < 6; ++i){
			sizeSeed -= sizeProb[i]
			if (sizeSeed <= 0){
				teamSize = i + 1;
				break;
			}
		}
		//samples the set of all teams, even < 6, uniformly
		//however there are more teams the larger they get, so actually 98% of teams are full
		while (pokemonPool.length && pokemon.length < teamSize) {
			var species = this.dex.species.get(this.sampleNoReplace(pokemonPool));

			if (!species.exists || !species.randomBattleMoves) continue;
			// Limit to one of each species (Species Clause)
			if (baseFormes[species.baseSpecies]) continue;

			const tier = species.tier;
			if (tier == "Uber") continue;

			// Okay, the set passes, add it to our team
			const set = this.randomSet(species, {forceMoves : []});
			pokemon.push(set);

		}

		if (pokemon.length < teamSize && !isMonotype && !this.forceMonotype) {
			throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
		}

		return pokemon;
	}
} exports.RandomGen3Teams = RandomGen3Teams;

exports. default = RandomGen3Teams;
 //# sourceMappingURL=sourceMaps/random-teams.js.map