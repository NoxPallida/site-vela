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
  Diamond:  {},
  Time:     {},
  Space:    {},
  Shadow:   {},
  Divine:   {}
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

export function getTypeEffectiveness(types = [], abilities = []) {
	const ALL_TYPES = [
		'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
		'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
    'Diamond', 'Space', 'Time', 'Shadow', 'Divine'
	];

	const normAbilities = (abilities || []).map(a =>
		String(a).toLowerCase().replace(/[^a-z0-9]/g, '')
	);

	const hasAbility = (...names) => {
		return names.some(name => {
			const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
			return normAbilities.some(a => a.includes(norm));
		});
	};

	const effectiveness = {};

	ALL_TYPES.forEach((atkType) => {
		let mult = 1;
		(types || []).forEach((defType) => {
			const formattedDef = defType.charAt(0).toUpperCase() + defType.slice(1).toLowerCase();
			const formattedAtk = atkType.charAt(0).toUpperCase() + atkType.slice(1).toLowerCase();
			if (TYPE_CHART[formattedAtk] && TYPE_CHART[formattedAtk][formattedDef] !== undefined) {
				mult *= TYPE_CHART[formattedAtk][formattedDef];
			}
		});

		if (atkType === 'Ground' && hasAbility('Levitate', 'Lévitation', 'Earth Eater', 'Mange-Terre')) {
			mult = 0;
		}
		if (atkType === 'Water' && hasAbility('Water Absorb', 'Absorb Eau', 'Storm Drain', 'Lavabo', 'Dry Skin', 'Peau Sèche')) {
			mult = 0;
		}
		if (atkType === 'Fire' && hasAbility('Flash Fire', 'Torche', 'Well-Baked Body', 'Corps Cuit')) {
			mult = 0;
		}
		if (atkType === 'Electric' && hasAbility('Volt Absorb', 'Absorb Volt', 'Motor Drive', 'Motorisé', 'Lightning Rod', 'Paratonnerre')) {
			mult = 0;
		}
		if (atkType === 'Grass' && hasAbility('Sap Sipper', 'Herbivore')) {
			mult = 0;
		}

		if (atkType === 'Fire' && hasAbility('Thick Fat', 'Isograisse', 'Heatproof', 'Ignifugé', 'Water Bubble', 'Aquabulle')) {
			mult *= 0.5;
		}
		if (atkType === 'Ice' && hasAbility('Thick Fat', 'Isograisse')) {
			mult *= 0.5;
		}
		if (atkType === 'Ghost' && hasAbility('Purifying Salt', 'Sel Purificateur')) {
			mult *= 0.5;
		}
		if (atkType === 'Fire' && hasAbility('Fluffy', 'Toison')) {
			mult *= 2;
		}

		if (hasAbility('Wonder Guard', 'Garde Magique') && mult <= 1) {
			mult = 0;
		}

		effectiveness[atkType] = mult;
	});

	return effectiveness;
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
