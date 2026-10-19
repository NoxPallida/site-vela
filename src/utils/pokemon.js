import dexData from '../data/dex_data.json';
import movepoolsData from '../data/movepools.json';
import movesData from '../data/moves.json';

function normalizeKey(str) {
	return String(str || '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');
}

export const TYPE_CHART = {
	Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
	Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
	Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
	Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
	Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
	Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
	Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
	Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
	Ground:   { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
	Flying:   { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
	Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
	Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
	Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
	Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
	Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
	Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
	Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
	Fairy:    { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
	Diamond:  { Steel: 2, Diamond: 0.5, Dragon: 0.5, Water: 0.5, Fairy: 0.5, Fire: 0.5, Ice: 2, Rock: 2, Ghost: 2, Dark: 2, Flying: 2 },
};

export function extractStats(pokemon) {
	if (!pokemon) return {};
	return pokemon.attributes || pokemon.base || pokemon.stats || {};
}

export function getPokemonName(pokemon) {
	if (!pokemon) return 'Unknown';
	if (typeof pokemon.name === 'string') return pokemon.name;
	if (pokemon.name?.english) return pokemon.name.english;
	if (pokemon.name?.fr) return pokemon.name.fr;
	return 'Unknown';
}

export function getPokemonTypes(pokemon) {
	if (!pokemon) return [];
	return pokemon.types || pokemon.type || [];
}

export function formatMultiplier(mult) {
	if (mult === 0) return '0x';
	if (mult === 0.25) return '¼x';
	if (mult === 0.5) return '½x';
	if (mult === 1) return '1x';
	if (mult === 1.5) return '1½x';
	if (mult === 2) return '2x';
	if (mult === 4) return '4x';
	return `${mult}x`;
}

export function getTypeEffectiveness(types = [], abilities = []) {
	const ALL_TYPES = [
		'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
		'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
		'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy', 'Diamond'
	];

	const baseEffectiveness = {};

	ALL_TYPES.forEach((atkType) => {
		let mult = 1;
		(types || []).forEach((defType) => {
			const formattedDef = defType.charAt(0).toUpperCase() + defType.slice(1).toLowerCase();
			const formattedAtk = atkType.charAt(0).toUpperCase() + atkType.slice(1).toLowerCase();
			if (TYPE_CHART[formattedAtk] && TYPE_CHART[formattedAtk][formattedDef] !== undefined) {
				mult *= TYPE_CHART[formattedAtk][formattedDef];
			}
		});
		baseEffectiveness[atkType] = mult;
	});

	const normAbilities = (abilities || []).map(a =>
		String(a).toLowerCase().replace(/[^a-z0-9]/g, '')
	);

	const getAbilityName = (name) => {
			const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
			const foundIndex = normAbilities.findIndex(a => a.includes(norm));
			if (foundIndex !== -1) {
				return String(abilities[foundIndex])
					.replace(/\s*\([^)]*\)/gi, '')
					.trim();
			}
			return null;
		};

	const isSingleAbility = Array.isArray(abilities) && abilities.length === 1;
	const notes = [];

	const abilityHandlers = [
		{
			names: ['Dry Skin'],
			apply: (abilityName) => {
				const fireMult = (baseEffectiveness['Fire'] || 1) * 1.25;
				if (isSingleAbility) {
					baseEffectiveness['Water'] = 0;
					baseEffectiveness['Fire'] = fireMult;
				} else {
					notes.push({
						text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-water">Water</span> moves is 0× and <span class="type-badge type-fire">Fire</span> moves is ${formatMultiplier(fireMult)}.`
					});
				}
			}
		},
		{
			names: ['Thick Fat'],
			apply: (abilityName) => {
				const fireMult = (baseEffectiveness['Fire'] || 1) * 0.5;
				const iceMult = (baseEffectiveness['Ice'] || 1) * 0.5;
				if (isSingleAbility) {
					baseEffectiveness['Fire'] = fireMult;
					baseEffectiveness['Ice'] = iceMult;
				} else {
					notes.push({
						text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-fire">Fire</span> moves is ${formatMultiplier(fireMult)} and <span class="type-badge type-ice">Ice</span> moves is ${formatMultiplier(iceMult)}.`
					});
				}
			}
		},
		{
			names: ['Levitate', 'Earth Eater'],
			apply: (abilityName) => {
				if (baseEffectiveness['Ground'] !== 0) {
					if (isSingleAbility) {
						baseEffectiveness['Ground'] = 0;
					} else {
						notes.push({
							text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-ground">Ground</span> moves is 0×.`
						});
					}
				}
			}
		},
		{
			names: ['Water Absorb', 'Storm Drain'],
			apply: (abilityName) => {
				if (baseEffectiveness['Water'] !== 0) {
					if (isSingleAbility) {
						baseEffectiveness['Water'] = 0;
					} else {
						notes.push({
							text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-water">Water</span> moves is 0×.`
						});
					}
				}
			}
		},
		{
			names: ['Flash Fire', 'Well-Baked Body'],
			apply: (abilityName) => {
				if (baseEffectiveness['Fire'] !== 0) {
					if (isSingleAbility) {
						baseEffectiveness['Fire'] = 0;
					} else {
						notes.push({
							text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-fire">Fire</span> moves is 0×.`
						});
					}
				}
			}
		},
		{
			names: ['Volt Absorb', 'Motor Drive', 'Lightning Rod'],
			apply: (abilityName) => {
				if (baseEffectiveness['Electric'] !== 0) {
					if (isSingleAbility) {
						baseEffectiveness['Electric'] = 0;
					} else {
						notes.push({
							text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-electric">Electric</span> moves is 0×.`
						});
					}
				}
			}
		},
		{
			names: ['Sap Sipper'],
			apply: (abilityName) => {
				if (baseEffectiveness['Grass'] !== 0) {
					if (isSingleAbility) {
						baseEffectiveness['Grass'] = 0;
					} else {
						notes.push({
							text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-grass">Grass</span> moves is 0×.`
						});
					}
				}
			}
		},
		{
			names: ['Heatproof', 'Water Bubble'],
			apply: (abilityName) => {
				const fireMult = (baseEffectiveness['Fire'] || 1) * 0.5;
				if (isSingleAbility) {
					baseEffectiveness['Fire'] = fireMult;
				} else {
					notes.push({
						text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-fire">Fire</span> moves is ${formatMultiplier(fireMult)}.`
					});
				}
			}
		},
		{
			names: ['Purifying Salt'],
			apply: (abilityName) => {
				const ghostMult = (baseEffectiveness['Ghost'] || 1) * 0.5;
				if (isSingleAbility) {
					baseEffectiveness['Ghost'] = ghostMult;
				} else {
					notes.push({
						text: `If this Pokémon has ${abilityName}, the effectiveness of <span class="type-badge type-ghost">Ghost</span> moves is ${formatMultiplier(ghostMult)}.`
					});
				}
			}
		},
		{
			names: ['Fluffy'],
			apply: (abilityName) => {
				const fireMult = (baseEffectiveness['Fire'] || 1) * 2;
				if (isSingleAbility) {
					baseEffectiveness['Fire'] = fireMult;
				} else {
					notes.push({
						text: `If this Pokémon has ${abilityName}, the effectiveness of contact moves is 0.5× and <span class="type-badge type-fire">Fire</span> moves is ${formatMultiplier(fireMult)}.`
					});
				}
			}
		},
		{
			names: ['Wonder Guard'],
			apply: (abilityName) => {
				if (isSingleAbility) {
					ALL_TYPES.forEach(t => {
						if (baseEffectiveness[t] <= 1) {
							baseEffectiveness[t] = 0;
						}
					});
				} else {
					notes.push({
						text: `If this Pokémon has <strong>${abilityName}</strong>, only super-effective moves will deal damage.`
					});
				}
			}
		}
	];

	abilityHandlers.forEach(handler => {
		handler.names.forEach(targetName => {
			const matchName = getAbilityName(targetName);
			if (matchName) {
				handler.apply(matchName);
			}
		});
	});

	return {
		effectiveness: baseEffectiveness,
		notes
	};
}

export function getPokemonMovepool(pkmId) {
	const pkmMovepool = movepoolsData[pkmId] || movepoolsData[String(Number(pkmId))] || [];

	const normalizedMoves = {};
	Object.entries(movesData).forEach(([key, move]) => {
		normalizedMoves[normalizeKey(key)] = move;
		if (move.name) {
			normalizedMoves[normalizeKey(move.name)] = move;
		}
	});

	return pkmMovepool.map((entry) => {
		const moveRawName = entry.move || entry.name || entry.moveId;
		const lookupKey = normalizeKey(moveRawName);
		const moveDetails = normalizedMoves[lookupKey];

		return {
			level: entry.level ?? entry.lvl ?? 0,
			name: moveDetails?.name || moveRawName || 'Unknown Move',
			type: moveDetails?.type || 'Normal',
			category: moveDetails?.category || moveDetails?.damage_class || 'Physical',
			power: moveDetails?.power ?? moveDetails?.base_power ?? '-',
			accuracy: moveDetails?.accuracy ?? '-'
		};
	});
}

export function calcStat(base, isHP, level = 100) {
	const baseNum = Number(base) || 0;

	if (isHP) {
		if (baseNum === 1) {
			return { min: 1, max: 1 };
		}
		const min = Math.floor(((2 * baseNum) * level) / 100) + level + 10;
		const max = Math.floor(((2 * baseNum + 31 + 63) * level) / 100) + level + 10;
		return { min, max };
	} else {
		const min = Math.floor((Math.floor(((2 * baseNum) * level) / 100) + 5) * 0.9);
		const max = Math.floor((Math.floor(((2 * baseNum + 31 + 63) * level) / 100) + 5) * 1.1);
		return { min, max };
	}
}
