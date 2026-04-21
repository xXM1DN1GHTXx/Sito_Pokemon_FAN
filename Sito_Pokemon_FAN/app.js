// Globals
const POKEMON_COUNT = 151;
let allPokemon = [];
let myTeams = []; // Array di oggetti { id: number, name: string, members: [] }

// DOM Elements - Views
const views = document.querySelectorAll('.view-section');
const navBtns = document.querySelectorAll('.nav-btn');

// DOM Elements - Pokedex
const pokedex = document.getElementById('pokedex');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('search-input');

// DOM Elements - Modals
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContent = document.getElementById('modal-content');
const closeBtn = document.getElementById('close-btn');
const modalTeamSelect = document.getElementById('modal-team-select');
const modalAddBtn = document.getElementById('modal-add-btn');

// DOM Elements - Teams
const teamNameInput = document.getElementById('new-team-name');
const createTeamBtn = document.getElementById('create-team-btn');
const teamsContainer = document.getElementById('teams-container');

// DOM Elements - Battle 
const team1Select = document.getElementById('team1-select');
const team2Select = document.getElementById('team2-select');
const startBattleBtn = document.getElementById('start-battle-btn');
const battleSetupDiv = document.getElementById('battle-setup');
const battleArenaDiv = document.getElementById('battle-arena');
const endBattleBtn = document.getElementById('end-battle-btn');

const battleLog = document.getElementById('battle-log');
const battleControls = document.getElementById('battle-controls');

// Helper Colors
const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C',
    ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
    psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
    dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

// -----------------------------------------
// 1. INIT & FETCH
// -----------------------------------------
async function initApp() {
    loadTeamsFromStorage();
    await fetchPokemon();
    setupNavigation();
    setupPokedexEventListeners();
    setupTeamEventListeners();
    setupBattleEventListeners();
    updateTeamSelects();
    renderTeams();
}

// Dati per Mosse Generate
const movesByType = {
    normal: ['Azione', 'Graffio', 'Botta', 'Iper Raggio', 'Attacco Rapido', 'Capocciata'],
    fire: ['Braciere', 'Lanciafiamme', 'Fuocobomba', 'Turbofuoco'],
    water: ['Pistolacqua', 'Idropompa', 'Surf', 'Bolla'],
    electric: ['Tuonoshock', 'Fulmine', 'Tuono', 'Scintilla'],
    grass: ['Frustata', 'Foglielama', 'Solarraggio', 'Assorbimento'],
    ice: ['Gelaurora', 'Geloraggio', 'Bora', 'Gelopugno'],
    fighting: ['Colpokarate', 'Sottomissione', 'Calciorullo', 'Doppiocalcio'],
    poison: ['Velenospina', 'Fango', 'Tossina', 'Velenodente'],
    ground: ['Terremoto', 'Fossa', 'Pantanobomba', 'Ossomerang'],
    flying: ['Beccata', 'Volo', 'Attacco d\'Ala', 'Aeroassalto'],
    psychic: ['Confusione', 'Psichico', 'Ipnosi', 'Psicoraggio'],
    bug: ['Millebave', 'Missilspillo', 'Forbice X', 'Segnoraggio'],
    rock: ['Sassata', 'Frana', 'Cadutamassi', 'Rocciotomba'],
    ghost: ['Leccata', 'Ombra Notturna', 'Palla Ombra', 'Spettrotuffo'],
    dragon: ['Ira di Drago', 'Codadrago', 'Dragartigli', 'Dragospiro'],
    dark: ['Morso', 'Sgranocchio', 'Finta', 'Neropulsar'],
    steel: ['Codacciaio', 'Meteorpugno', 'Ferroscudo', 'Metaltestata'],
    fairy: ['Carineria', 'Forza Lunare', 'Vento di Fata', 'Magibrillio']
};

function generateMoves(types) {
    const moves = [];
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // 2 Normal moves
    const normPool = [...movesByType.normal];
    moves.push(normPool.splice(Math.floor(Math.random() * normPool.length), 1)[0]);
    moves.push(normPool.splice(Math.floor(Math.random() * normPool.length), 1)[0]);
    
    if (types.length === 1) {
        // 2 mosse del suo tipo
        const typePool = [...(movesByType[types[0]] || movesByType.normal)]; // fallback
        moves.push(typePool.splice(Math.floor(Math.random() * typePool.length), 1)[0] || 'Azione');
        moves.push(typePool.splice(Math.floor(Math.random() * typePool.length), 1)[0] || 'Botta');
    } else {
        // 1 per ogni suo tipo
        const p1 = movesByType[types[0]] || movesByType.normal;
        const p2 = movesByType[types[1]] || movesByType.normal;
        moves.push(rnd(p1));
        moves.push(rnd(p2));
    }
    return moves;
}

async function fetchPokemon() {
    try {
        const promises = [];
        for (let i = 1; i <= POKEMON_COUNT; i++) {
            promises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(res => res.json()));
        }

        const results = await Promise.all(promises);
        
        allPokemon = results.map(data => {
            const typesMapped = data.types.map(type => type.type.name);
            const generatedMoves = generateMoves(typesMapped);
            
            // Stats parsing
            const stats = {};
            data.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });

            return {
                id: data.id,
                name: data.name,
                image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
                backImage: data.sprites.back_default || data.sprites.front_default,
                types: typesMapped,
                hp: stats['hp'],
                maxHp: stats['hp'] * 3, // Boosted for battle simulation length
                attack: stats['attack'],
                defense: stats['defense'],
                speed: stats['speed'],
                moves: generatedMoves
            };
        });
        
        loader.classList.add('hidden');
        document.getElementById('pokedex-view').classList.remove('hidden');
        displayPokemon(allPokemon);
    } catch (error) {
        console.error("Error fetching Pokemon:", error);
        loader.innerHTML = "<p>Errore severo nel recupero dei file da PokeAPI.</p>";
    }
}

// -----------------------------------------
// 2. NAVIGATION
// -----------------------------------------
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const targetView = e.target.getAttribute('data-target');
            views.forEach(v => v.classList.add('hidden'));
            document.getElementById(targetView).classList.remove('hidden');
            
            if (targetView === 'battle-view') {
                updateTeamSelects(); // refresh dropdowns just in case
            }
            if (targetView === 'league-view') {
                updateLeagueView();
            }
            if (targetView === 'tournament-view') {
                updateTourneySelects();
            }
        });
    });
}

// -----------------------------------------
// 3. POKEDEX
// -----------------------------------------
function displayPokemon(pokemonData) {
    if (pokemonData.length === 0) {
        pokedex.innerHTML = '<p>Nessun Pokémon trovato.</p>';
        return;
    }
    pokedex.innerHTML = pokemonData.map(pokemon => {
        const primaryType = pokemon.types[0];
        const color = typeColors[primaryType] || '#777';
        const typesHtml = pokemon.types.map(t => `<span class="type-badge" style="background-color: ${typeColors[t]}">${t}</span>`).join('');

        return `
            <div class="pokemon-card" style="--card-color: ${color}" onclick="openModal(${pokemon.id})">
                <span class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</span>
                <div class="pokemon-image-container">
                    <img class="pokemon-image" src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
                </div>
                <h2 class="pokemon-name">${pokemon.name}</h2>
                <div class="pokemon-types">${typesHtml}</div>
            </div>
        `;
    }).join('');
}

let activeModalPokemonId = null;

function openModal(id) {
    const pokemon = allPokemon.find(p => p.id === id);
    if (!pokemon) return;
    activeModalPokemonId = id;

    const typesHtml = pokemon.types.map(t => `<span class="type-badge" style="background-color: ${typeColors[t]}">${t}</span>`).join('');

    modalContent.innerHTML = `
        <div style="text-align:center; padding-bottom:1rem;">
            <img class="modal-image" src="${pokemon.image}" alt="${pokemon.name}">
            <h2 style="font-size: 2rem; margin-bottom:0.5rem; text-transform:capitalize;">${pokemon.name}</h2>
            <div>${typesHtml}</div>
            <div style="display:flex; justify-content:center; gap: 1rem; margin-top:1rem; color:#aaa; font-size:0.9rem;">
                <span>HP: ${(pokemon.hp*3)}</span>
                <span>ATK: ${pokemon.attack}</span>
                <span>DEF: ${pokemon.defense}</span>
                <span>SPD: ${pokemon.speed}</span>
            </div>
            <p style="margin-top:1rem; font-size:0.9rem;">Mosse: ${pokemon.moves.join(', ')}</p>
        </div>
    `;

    updateModalTeamDropdown();
    modalBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function updateModalTeamDropdown() {
    if (myTeams.length === 0) {
        modalTeamSelect.innerHTML = '<option value="">Crea prima una squadra!</option>';
        modalTeamSelect.disabled = true;
        modalAddBtn.disabled = true;
    } else {
        modalTeamSelect.innerHTML = myTeams.map(t => `<option value="${t.id}">${t.name} (${t.members.length}/6)</option>`).join('');
        modalTeamSelect.disabled = false;
        modalAddBtn.disabled = false;
    }
}

function setupPokedexEventListeners() {
    searchInput.addEventListener('input', (e) => {
        const searchString = e.target.value.toLowerCase();
        displayPokemon(allPokemon.filter(p => p.name.toLowerCase().includes(searchString)));
    });

    closeBtn.addEventListener('click', () => { modalBackdrop.classList.add('hidden'); document.body.style.overflow = ''; });
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) { modalBackdrop.classList.add('hidden'); document.body.style.overflow = ''; }
    });

    modalAddBtn.addEventListener('click', () => {
        const teamId = parseInt(modalTeamSelect.value);
        if (!teamId || !activeModalPokemonId) return;
        
        const team = myTeams.find(t => t.id === teamId);
        if (team.members.length >= 6) {
            alert("Questa squadra è già al completo (6/6)!");
            return;
        }
        team.members.push(activeModalPokemonId);
        saveTeamsToStorage();
        updateModalTeamDropdown();
        renderTeams();
        alert(`Aggiunto al team ${team.name}!`);
    });
}

// -----------------------------------------
// 4. TEAM BUILDER
// -----------------------------------------
function loadTeamsFromStorage() {
    const saved = localStorage.getItem('pokeTeams');
    if (saved) {
        myTeams = JSON.parse(saved);
    }
}

function saveTeamsToStorage() {
    localStorage.setItem('pokeTeams', JSON.stringify(myTeams));
    updateTeamSelects();
}

function setupTeamEventListeners() {
    createTeamBtn.addEventListener('click', () => {
        const name = teamNameInput.value.trim();
        if (!name) return;
        myTeams.push({
            id: Date.now(),
            name: name,
            members: [],
            leagueProgress: 0
        });
        teamNameInput.value = '';
        saveTeamsToStorage();
        renderTeams();
    });
}

function renderTeams() {
    if (myTeams.length === 0) {
        teamsContainer.innerHTML = '<p style="color:#aaa;">Non hai ancora creato nessuna squadra.</p>';
        return;
    }

    teamsContainer.innerHTML = myTeams.map(team => {
        const membersHtml = team.members.map((memberId, idx) => {
            const p = allPokemon.find(p => p.id === memberId);
            if (!p) return '';
            return `
                <div class="team-member-slot">
                    <img src="${p.image}" class="team-member-img">
                    <button class="remove-member" onclick="removeMember(${team.id}, ${idx})">X</button>
                </div>
            `;
        }).join('');

        // generate empty slots
        const emptySlotsCount = 6 - team.members.length;
        let emptyHtml = '';
        for(let i=0; i<emptySlotsCount; i++){
            emptyHtml += `<div class="team-member-slot" style="opacity:0.3">?</div>`;
        }

        return `
            <div class="team-box">
                <div class="team-header">
                    <h3>${team.name}</h3>
                    <button onclick="deleteTeam(${team.id})" class="action-btn small-btn" style="background:#555">Elimina</button>
                </div>
                <div class="team-members">
                    ${membersHtml}
                    ${emptyHtml}
                </div>
            </div>
        `;
    }).join('');
}

window.removeMember = function(teamId, memberIndex) {
    const team = myTeams.find(t => t.id === teamId);
    if(team) {
        team.members.splice(memberIndex, 1);
        saveTeamsToStorage();
        renderTeams();
    }
};

window.deleteTeam = function(teamId) {
    myTeams = myTeams.filter(t => t.id !== teamId);
    saveTeamsToStorage();
    renderTeams();
};

let battleState = {
    active: false,
    playerTeam: null,
    enemyTeam: null,
    playerActiveIdx: 0,
    enemyActiveIdx: 0,
    turnPhase: 1,
    p1MoveIdx: null
};

let team1Order = [];
let team2Order = [];
let currentT1val = null;
let currentT2val = null;

function updateTeamSelects() {
    const validTeams = myTeams.filter(t => t.members.length > 0);
    const options = validTeams.map(t => `<option value="${t.id}">${t.name} (${t.members.length} PKMN)</option>`).join('');
    
    team1Select.innerHTML = '<option value="">-- Scegli G1 --</option>' + options;
    team2Select.innerHTML = '<option value="">-- Scegli G2 --</option>' + options;
    
    checkBattleReady();
}

function checkBattleReady() {
    const orderContainer = document.getElementById('order-container');
    if (team1Select.value && team2Select.value) {
        startBattleBtn.disabled = false;
        orderContainer.classList.remove('hidden');
        
        if (team1Select.value !== currentT1val) {
            const t1 = myTeams.find(t => t.id === parseInt(team1Select.value));
            team1Order = [...t1.members];
            currentT1val = team1Select.value;
        }
        if (team2Select.value !== currentT2val) {
            const t2 = myTeams.find(t => t.id === parseInt(team2Select.value));
            team2Order = [...t2.members];
            currentT2val = team2Select.value;
        }
        
        renderOptions();
    } else {
        startBattleBtn.disabled = true;
        
        // Check if element exists before modifying its classList
        if(orderContainer) {
            orderContainer.classList.add('hidden');
        }
        
        currentT1val = null;
        currentT2val = null;
    }
}

function renderOptions() {
    const list1 = document.getElementById('t1-order-list');
    const list2 = document.getElementById('t2-order-list');
    if(!list1 || !list2) return;
    
    list1.innerHTML = team1Order.map((id, idx) => {
        const p = allPokemon.find(x => x.id === id);
        return `<li class="order-item">
                    <div class="order-item-info"><img src="${p.image}"> ${p.name}</div>
                    <div class="order-controls">
                        <button ${idx === 0 ? 'disabled' : ''} onclick="moveOrder(1, ${idx}, -1)">▲</button>
                        <button ${idx === team1Order.length -1 ? 'disabled' : ''} onclick="moveOrder(1, ${idx}, 1)">▼</button>
                    </div>
                </li>`;
    }).join('');

    list2.innerHTML = team2Order.map((id, idx) => {
        const p = allPokemon.find(x => x.id === id);
        return `<li class="order-item">
                    <div class="order-item-info"><img src="${p.image}"> ${p.name}</div>
                    <div class="order-controls">
                        <button ${idx === 0 ? 'disabled' : ''} onclick="moveOrder(2, ${idx}, -1)">▲</button>
                        <button ${idx === team2Order.length -1 ? 'disabled' : ''} onclick="moveOrder(2, ${idx}, 1)">▼</button>
                    </div>
                </li>`;
    }).join('');
}

window.moveOrder = function(teamNum, index, dir) {
    const arr = teamNum === 1 ? team1Order : team2Order;
    const temp = arr[index];
    arr[index] = arr[index + dir];
    arr[index + dir] = temp;
    renderOptions();
};

function setupBattleEventListeners() {
    team1Select.addEventListener('change', checkBattleReady);
    team2Select.addEventListener('change', checkBattleReady);

    startBattleBtn.addEventListener('click', () => {
        const t1Id = parseInt(team1Select.value);
        const t2Id = parseInt(team2Select.value);
        
        let p1Data = JSON.parse(JSON.stringify(myTeams.find(t => t.id === t1Id)));
        let p2Data = JSON.parse(JSON.stringify(myTeams.find(t => t.id === t2Id)));

        p1Data.members = team1Order;
        p2Data.members = team2Order;

        initBattle(p1Data, p2Data);
    });
    
    endBattleBtn.addEventListener('click', () => {
        battleArenaDiv.classList.add('hidden');
        endBattleBtn.classList.add('hidden');
        
        if (battleState.isLeagueEngine) {
            document.getElementById('battle-view').classList.add('hidden');
            document.getElementById('league-view').classList.remove('hidden');
            
            navBtns.forEach(b => b.classList.remove('active'));
            const leagueNav = document.querySelector('[data-target="league-view"]');
            if(leagueNav) leagueNav.classList.add('active');
            
            updateLeagueView();
        } else if (battleState.isTournamentEngine) {
            document.getElementById('battle-view').classList.add('hidden');
            document.getElementById('tournament-view').classList.remove('hidden');
            
            navBtns.forEach(b => b.classList.remove('active'));
            const tourneyNav = document.querySelector('[data-target="tournament-view"]');
            if(tourneyNav) tourneyNav.classList.add('active');
            
            const match = battleState.tourneyMatchRef;
            if (match && !match.completed) {
                match.completed = true;
                if (battleState.winnerObj === 1) {
                    match.winner = 1;
                    tourneyRoundWinners.push(match.p1);
                } else {
                    match.winner = 2;
                    tourneyRoundWinners.push(match.p2);
                }
                renderTourneyBracket();
            }
        } else {
            battleSetupDiv.classList.remove('hidden');
        }
    });
}

function initBattle(t1, t2) {
    battleSetupDiv.classList.add('hidden');
    battleArenaDiv.classList.remove('hidden');
    
    const mapFullData = (memberList) => {
        return memberList.map(id => {
            const pkmn = allPokemon.find(p => p.id === id);
            return { 
                ...pkmn, 
                currentHp: pkmn.maxHp,
                currentSp: 100,
                maxSp: 100
            };
        });
    };

    battleState = {
        active: true,
        playerTeam: mapFullData(t1.members),
        enemyTeam: mapFullData(t2.members),
        playerActiveIdx: 0,
        enemyActiveIdx: 0,
        turnPhase: 1,
        p1MoveIdx: null
    };

    battleLog.innerHTML = `La battaglia tra ${t1.name} (G1) e ${t2.name} (G2) inizia!<br>`;
    
    updateField();
    renderMovesForPhase();
}

function getActive(side) {
    return side === 'player' ? battleState.playerTeam[battleState.playerActiveIdx] : battleState.enemyTeam[battleState.enemyActiveIdx];
}

function updateField() {
    if(!battleState.active) return;
    
    const pOut = getActive('player');
    const eOut = getActive('enemy');

    // Update Player HUD (G1)
    document.getElementById('player-name').innerText = pOut.name;
    document.getElementById('player-sprite').src = pOut.backImage;
    document.getElementById('player-hp-current').innerText = Math.max(0, Math.floor(pOut.currentHp));
    document.getElementById('player-hp-max').innerText = pOut.maxHp;
    const pPerc = Math.max(0, (pOut.currentHp / pOut.maxHp) * 100);
    const pFill = document.getElementById('player-hp-fill');
    pFill.style.width = pPerc + '%';
    pFill.style.backgroundColor = pPerc > 50 ? '#00ff00' : (pPerc > 20 ? '#ffcc00' : '#ff0000');
    
    document.getElementById('player-sp-current').innerText = Math.max(0, pOut.currentSp);
    document.getElementById('player-sp-max').innerText = pOut.maxSp;
    document.getElementById('player-sp-fill').style.width = Math.max(0, (pOut.currentSp / pOut.maxSp) * 100) + '%';

    // Update Enemy HUD (G2)
    document.getElementById('enemy-name').innerText = eOut.name;
    document.getElementById('enemy-sprite').src = eOut.image;
    document.getElementById('enemy-hp-current').innerText = Math.max(0, Math.floor(eOut.currentHp));
    document.getElementById('enemy-hp-max').innerText = eOut.maxHp;
    const ePerc = Math.max(0, (eOut.currentHp / eOut.maxHp) * 100);
    const eFill = document.getElementById('enemy-hp-fill');
    eFill.style.width = ePerc + '%';
    eFill.style.backgroundColor = ePerc > 50 ? '#00ff00' : (ePerc > 20 ? '#ffcc00' : '#ff0000');

    document.getElementById('enemy-sp-current').innerText = Math.max(0, eOut.currentSp);
    document.getElementById('enemy-sp-max').innerText = eOut.maxSp;
    document.getElementById('enemy-sp-fill').style.width = Math.max(0, (eOut.currentSp / eOut.maxSp) * 100) + '%';
}

function renderMovesForPhase() {
    if(!battleState.active) return;
    battleControls.innerHTML = '';
    
    if (battleState.turnPhase === 1) {
        logMsg(`<span style="color:#aaf">In attesa di G1 (${getActive('player').name})...</span>`);
        const pkmn = getActive('player');
        
        // 4 Moves
        pkmn.moves.forEach((move, mIdx) => {
            const cost = getMoveCost(move);
            const btn = document.createElement('button');
            btn.className = 'move-btn';
            btn.style.backgroundColor = "#246";
            btn.innerHTML = `${move} <br><small>(${cost} SP)</small>`;
            if (pkmn.currentSp < cost) btn.disabled = true;
            btn.onclick = () => {
                battleState.p1MoveIdx = mIdx;
                battleState.turnPhase = 2;
                renderMovesForPhase();
            };
            battleControls.appendChild(btn);
        });
        
        // RIPOSO button
        const restBtn = document.createElement('button');
        restBtn.className = 'move-btn';
        restBtn.style.backgroundColor = "#285";
        restBtn.innerHTML = `Riposo <br><small>(Ripristina SP)</small>`;
        restBtn.onclick = () => {
             battleState.p1MoveIdx = -1; // -1 represents REST
             battleState.turnPhase = 2;
             renderMovesForPhase();
        };
        battleControls.appendChild(restBtn);

    } else if (battleState.turnPhase === 2) {
        logMsg(`<span style="color:#faa">In attesa di G2 (${getActive('enemy').name})...</span>`);
        const pkmn = getActive('enemy');
        
        if (battleState.isLeagueEngine) {
            // CPU AI LOGIC
            const availableMoves = [];
            pkmn.moves.forEach((m, idx) => {
                if (pkmn.currentSp >= getMoveCost(m)) availableMoves.push(idx);
            });
            
            setTimeout(() => {
                if(!battleState.active) return;
                
                let pickedIdx = -1;
                if (availableMoves.length === 0) {
                    pickedIdx = -1; // Force Riposo if no SP
                } else {
                    // Try to evaluate super effective moves
                    let bestScore = -1;
                    const pTeamActive = getActive('player');
                    
                    availableMoves.forEach(idx => {
                        const mName = pkmn.moves[idx];
                        const mType = getMoveType(mName);
                        let moveEffectiveness = 1;
                        
                        pTeamActive.types.forEach(defType => {
                            if (typeEffectiveness[mType] && typeEffectiveness[mType][defType] !== undefined) {
                                moveEffectiveness *= typeEffectiveness[mType][defType];
                            }
                        });
                        
                        if (moveEffectiveness > bestScore) {
                            bestScore = moveEffectiveness;
                            pickedIdx = idx;
                        }
                    });
                    
                    // Add some randomness so AI isn't 100% predictable
                    if (Math.random() < 0.3) {
                        pickedIdx = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                    }
                }
                processTurnClash(battleState.p1MoveIdx, pickedIdx);
            }, 1400); // UI delay for tension
            
            return; // Skip drawing buttons for Enemy in League Mode
        }
        
        pkmn.moves.forEach((move, mIdx) => {
            const cost = getMoveCost(move);
            const btn = document.createElement('button');
            btn.className = 'move-btn';
            btn.style.backgroundColor = "#622";
            btn.innerHTML = `${move} <br><small>(${cost} SP)</small>`;
            if (pkmn.currentSp < cost) btn.disabled = true;
            btn.onclick = () => processTurnClash(battleState.p1MoveIdx, mIdx);
            battleControls.appendChild(btn);
        });
        
        // RIPOSO button
        const restBtn = document.createElement('button');
        restBtn.className = 'move-btn';
        restBtn.style.backgroundColor = "#852";
        restBtn.innerHTML = `Riposo <br><small>(Ripristina SP)</small>`;
        restBtn.onclick = () => processTurnClash(battleState.p1MoveIdx, -1);
        battleControls.appendChild(restBtn);
    }
}

const typeEffectiveness = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

function getMoveType(moveName) {
    for (const [type, moves] of Object.entries(movesByType)) {
        if (moves.includes(moveName)) return type;
    }
    return 'normal';
}

function getDamage(attacker, defender, moveName) {
    const baseDmg = 20; 
    let modifier = (attacker.attack / defender.defense) * (Math.random() * 0.4 + 0.8);
    
    let isCrit = false;
    if(Math.random() < 0.1) {
        modifier *= 1.5;
        isCrit = true;
    }
    
    const moveType = getMoveType(moveName);
    let typeModifier = 1;
    
    // Multiply against all defender types
    defender.types.forEach(defType => {
        if (typeEffectiveness[moveType] && typeEffectiveness[moveType][defType] !== undefined) {
            typeModifier *= typeEffectiveness[moveType][defType];
        }
    });
    
    // STAB (Same Type Attack Bonus)
    if (attacker.types.includes(moveType)) {
        typeModifier *= 1.5;
    }
    
    const finalDamage = Math.floor(baseDmg * modifier * typeModifier) + 1; // +1 to ensure min damage unless immune
    
    return {
        damage: typeModifier === 0 ? 0 : finalDamage,
        isCrit: isCrit,
        effectiveness: typeModifier
    };
}

function disableControls(state) {
    const btns = battleControls.querySelectorAll('.move-btn');
    btns.forEach(b => b.disabled = state);
}

function logMsg(msg) {
    battleLog.innerHTML += `<div>> ${msg}</div>`;
    battleLog.scrollTop = battleLog.scrollHeight;
}

const movePriority = {
    'Attacco Rapido': 1,
    'Codadrago': -6
};

const moveCost = {
    'Iper Raggio': 50,
    'Fuocobomba': 40,
    'Idropompa': 40,
    'Bora': 40,
    'Solarraggio': 40,
    'Terremoto': 35,
    'Attacco Rapido': 10,
    'Azione': 10,
    'Botta': 10,
    'Graffio': 10
};

function getMoveCost(moveName) {
    if (moveName === 'Riposo') return 0;
    return moveCost[moveName] || 20;
}

async function processTurnClash(p1Idx, p2Idx) {
    disableControls(true);

    const player = getActive('player');
    const enemy = getActive('enemy');

    const pMove = p1Idx === -1 ? 'Riposo' : player.moves[p1Idx];
    const eMove = p2Idx === -1 ? 'Riposo' : enemy.moves[p2Idx]; 

    // Determine speed
    let first, second, fMove, sMove, fID, sID;
    
    const pPri = movePriority[pMove] || 0;
    const ePri = movePriority[eMove] || 0;
    
    let pGoesFirst = false;
    
    if (pPri > ePri) {
        pGoesFirst = true; // Player move has higher priority
    } else if (ePri > pPri) {
        pGoesFirst = false; // Enemy move has higher priority
    } else {
        // Same priority bracket, fallback to raw Speed stats
        if (player.speed > enemy.speed) pGoesFirst = true;
        else if (enemy.speed > player.speed) pGoesFirst = false;
        else {
            // Speed Tie -> 50% chance
            pGoesFirst = Math.random() < 0.5;
        }
    }

    if(pGoesFirst) {
        first = player; sID = 'enemy'; fID = 'player'; fMove = pMove;
        second = enemy; sMove = eMove;
    } else {
        first = enemy; sID = 'player'; fID = 'enemy'; fMove = eMove;
        second = player; sMove = pMove;
    }

    // First strike
    await executeAttack(first, second, fMove, fID, sID);
    if(second.currentHp <= 0) {
        await handleFaint(second, sID);
        resumePhase();
        return;
    }

    // Second strike
    await executeAttack(second, first, sMove, sID, fID);
    if(first.currentHp <= 0) {
        await handleFaint(first, fID);
    }
    
    resumePhase();
}

function resumePhase() {
    if (battleState.active) {
        battleState.turnPhase = 1;
        battleState.p1MoveIdx = null;
        renderMovesForPhase();
    }
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function executeAttack(attacker, defender, moveName, attackerRole, defenderRole) {
    if (moveName === 'Riposo') {
        logMsg(`<b>${attacker.name.toUpperCase()}</b> si riposa e recupera SP!`);
        attacker.currentSp = Math.min(attacker.maxSp, attacker.currentSp + 40);
        updateField();
        await sleep(600);
        return; // Non fa danni, salta l'attacco
    }

    logMsg(`<b>${attacker.name.toUpperCase()}</b> usa ${moveName.toUpperCase()}!`);
    
    attacker.currentSp -= getMoveCost(moveName);
    updateField(); // Aggiorna barra stamina
    
    const attImg = document.getElementById(`${attackerRole}-sprite`);
    attImg.classList.add('attack-anim');
    await sleep(300);
    attImg.classList.remove('attack-anim');

    const dmgData = getDamage(attacker, defender, moveName);
    defender.currentHp -= dmgData.damage;

    if (dmgData.isCrit && dmgData.damage > 0) {
        logMsg("Brutto colpo!");
    }
    
    if (dmgData.effectiveness > 1) {
        logMsg("È superefficace!");
    } else if (dmgData.effectiveness < 1 && dmgData.effectiveness > 0) {
        logMsg("Non è molto efficace...");
    } else if (dmgData.effectiveness === 0) {
        logMsg("Non ha alcun effetto!");
    }
    
    // force update HUD instantly for damage visualization
    if(defenderRole === 'player') {
        const perc = Math.max(0, (defender.currentHp / defender.maxHp) * 100);
        document.getElementById('player-hp-current').innerText = Math.max(0, Math.floor(defender.currentHp));
        document.getElementById('player-hp-fill').style.width = perc + '%';
    } else {
        const perc = Math.max(0, (defender.currentHp / defender.maxHp) * 100);
        document.getElementById('enemy-hp-current').innerText = Math.max(0, Math.floor(defender.currentHp));
        document.getElementById('enemy-hp-fill').style.width = perc + '%';
    }

    if (dmgData.damage > 0) {
        const defImg = document.getElementById(`${defenderRole}-sprite`);
        defImg.classList.add('hit-anim');
        await sleep(400);
        defImg.classList.remove('hit-anim');
    } else {
        await sleep(400); // Wait even if no damage
    }
}

async function handleFaint(faintedPkmn, role) {
    logMsg(`<b>${faintedPkmn.name.toUpperCase()} è esausto!</b>`);
    
    const sprite = document.getElementById(`${role}-sprite`);
    sprite.style.transform = "translateY(100px)";
    sprite.style.opacity = "0";
    await sleep(800);
    sprite.style.transform = "";
    sprite.style.opacity = "1";

    if(role === 'player') {
        const nextIdx = battleState.playerTeam.findIndex(p => p.currentHp > 0);
        if(nextIdx === -1) {
            endGame(false);
        } else {
            battleState.playerActiveIdx = nextIdx;
            logMsg(`G1 manda in campo ${battleState.playerTeam[nextIdx].name}.`);
            updateField();
        }
    } else {
        const nextIdx = battleState.enemyTeam.findIndex(p => p.currentHp > 0);
        if(nextIdx === -1) {
            endGame(true);
        } else {
            battleState.enemyActiveIdx = nextIdx;
            logMsg(`G2 manda in campo ${battleState.enemyTeam[nextIdx].name}.`);
            updateField();
        }
    }
}

function endGame(playerWon) {
    battleState.active = false;
    battleState.winnerObj = playerWon ? 1 : 2;
    battleControls.innerHTML = '';
    endBattleBtn.classList.remove('hidden');

    if(playerWon) {
        logMsg('<span style="color:#0f0; font-size:1.2rem;">GIOCATORE 1 (G1) VINCE LA BATTAGLIA!</span>');
        
        if (battleState.isLeagueEngine) {
            const team = myTeams.find(t => t.id === battleState.leagueTeamId);
            if (team) {
                team.leagueProgress = (team.leagueProgress || 0) + 1;
                saveTeamsToStorage();
            }
            logMsg('<span style="color:#ffcc00; font-weight:bold;">COMPLIMENTI! Hai superato questo livello della Lega Pokémon!</span>');
        } else if (battleState.isTournamentEngine) {
            logMsg('<span style="color:#ffcc00; font-weight:bold;">IL VINCITORE AVANZA NEL TABELLONE DEL TORNEO!</span>');
        }
    } else {
        logMsg('<span style="color:#0f0; font-size:1.2rem;">GIOCATORE 2 (G2) VINCE LA BATTAGLIA!</span>');
        if (battleState.isTournamentEngine) {
            logMsg('<span style="color:#ffcc00; font-weight:bold;">IL GIOCATORE 2 AVANZA NEL TABELLONE DEL TORNEO!</span>');
        }
    }
}

// -----------------------------------------
// 6. LEAGUE ENGINE (CAMPAIGN)
// -----------------------------------------
const LEAGUE_BOSSES = [
    { name: "Brock", title: "Capopalestra di Plumbeopoli", badge: "Medaglia Sasso", members: [74, 95] }, 
    { name: "Misty", title: "Capopalestra di Celestopoli", badge: "Medaglia Cascata", members: [120, 121] }, 
    { name: "Lt. Surge", title: "Capopalestra di Aranciopoli", badge: "Medaglia Tuono", members: [100, 25, 26] }, 
    { name: "Erika", title: "Capopalestra di Azzurropoli", badge: "Medaglia Arcobaleno", members: [71, 114, 45] }, 
    { name: "Koga", title: "Capopalestra di Fucsianopoli", badge: "Medaglia Anima", members: [109, 89, 110] }, 
    { name: "Sabrina", title: "Capopalestra di Zafferanopoli", badge: "Medaglia Palude", members: [64, 122, 49, 65] }, 
    { name: "Blaine", title: "Capopalestra dell'Isola Cannella", badge: "Medaglia Vulcano", members: [58, 77, 78, 59] }, 
    { name: "Giovanni", title: "Capopalestra di Smeraldopoli", badge: "Medaglia Terra", members: [51, 111, 31, 34, 112] }, 
    { name: "Lorelei", title: "Superquattro", badge: "Nessuna", members: [87, 91, 80, 124, 131] }, 
    { name: "Bruno", title: "Superquattro", badge: "Nessuna", members: [95, 107, 106, 68] }, 
    { name: "Agatha", title: "Superquattro", badge: "Nessuna", members: [94, 42, 93, 24, 94] }, 
    { name: "Lance", title: "Superquattro", badge: "Nessuna", members: [130, 148, 142, 149] }, 
    { name: "Blu", title: "Campione della Lega", badge: "Campione Assoluto", members: [18, 65, 112, 103, 130, 6] }
];

const leagueTeamSelect = document.getElementById('league-team-select');
const startLeagueBtn = document.getElementById('start-league-battle-btn');
const resetLeagueBtn = document.getElementById('reset-league-btn');

function updateLeagueView() {
    updateLeagueSelects();
    renderLeagueBossForSelected();
}

function renderLeagueBossForSelected() {
    const teamId = leagueTeamSelect.value;
    if (!teamId) {
        document.getElementById('league-boss-name').innerText = "...";
        document.getElementById('league-boss-desc').innerText = "Seleziona una squadra per cominciare";
        document.getElementById('league-roster-preview').innerHTML = "";
        startLeagueBtn.disabled = true;
        if(resetLeagueBtn) resetLeagueBtn.disabled = true;
        return;
    }

    const team = myTeams.find(t => t.id == teamId);
    const teamProgress = team.leagueProgress || 0;

    startLeagueBtn.disabled = false;
    if(resetLeagueBtn) resetLeagueBtn.disabled = false;

    if (teamProgress >= LEAGUE_BOSSES.length) {
        document.getElementById('league-boss-name').innerText = "CAMPIONE ASSOLUTO!";
        document.getElementById('league-boss-desc').innerHTML = "La tua squadra ha sconfitto tutta la Lega Pokémon!";
        document.getElementById('league-roster-preview').innerHTML = "";
        startLeagueBtn.disabled = true;
        return;
    }
    
    const boss = LEAGUE_BOSSES[teamProgress];
    document.getElementById('league-boss-name').innerText = boss.name;
    document.getElementById('league-boss-desc').innerText = `${boss.title} - ${boss.badge}`;
    
    const previewDiv = document.getElementById('league-roster-preview');
    previewDiv.innerHTML = '';
    
    if (allPokemon.length > 0) {
        boss.members.forEach(id => {
            const pkmn = allPokemon.find(p => p.id === id);
            if(pkmn) {
                previewDiv.innerHTML += `<img src="${pkmn.image}" title="${pkmn.name}">`;
            }
        });
    }
}

function updateLeagueSelects() {
    const currentVal = leagueTeamSelect.value;
    const validTeams = myTeams.filter(t => t.members.length > 0);
    const options = validTeams.map(t => `<option value="${t.id}">${t.name} (${t.members.length} PKMN)</option>`).join('');
    leagueTeamSelect.innerHTML = '<option value="">-- Seleziona tua squadra --</option>' + options;
    
    // restore selection if still valid
    if(validTeams.find(t => t.id == currentVal)) {
        leagueTeamSelect.value = currentVal;
    } else {
        leagueTeamSelect.value = '';
    }
}

leagueTeamSelect.addEventListener('change', () => {
    renderLeagueBossForSelected();
});

resetLeagueBtn.addEventListener('click', () => {
    const teamId = leagueTeamSelect.value;
    if (!teamId) return;
    if(confirm('Vuoi resettare i progressi della squadra selezionata per ricominciare da Brock?')) {
        const team = myTeams.find(t => t.id == teamId);
        if(team) {
            team.leagueProgress = 0;
            saveTeamsToStorage();
            renderLeagueBossForSelected();
        }
    }
});

startLeagueBtn.addEventListener('click', () => {
    const t1Id = parseInt(leagueTeamSelect.value);
    const p1Data = myTeams.find(t => t.id === t1Id);
    
    const boss = LEAGUE_BOSSES[p1Data.leagueProgress || 0];
    const bossData = {
        name: boss.name,
        members: [...boss.members]
    };
    
    // Switch to battle view ignoring standard tabs
    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('battle-view').classList.remove('hidden');
    document.getElementById('battle-setup').classList.add('hidden'); // Hide hotseat setup
    
    // Kickoff
    initBattle(p1Data, bossData);
    battleState.isLeagueEngine = true;
    battleState.leagueTeamId = t1Id;
});

// -----------------------------------------
// 7. TOURNAMENT ENGINE
// -----------------------------------------
let tourneyPlayers = []; 
let tourneyMatchesQueue = []; 
let tourneyRoundWinners = [];
let tourneyRoundNum = 1;

const tourneyTeamSelect = document.getElementById('tourney-team-select');
const tourneyPlayerName = document.getElementById('tourney-player-name');
const addTourneyPlayerBtn = document.getElementById('add-tourney-player-btn');
const startTourneyBtn = document.getElementById('start-tourney-btn');
const tourneyPlayersList = document.getElementById('tourney-players-list');
const tourneyCountSpn = document.getElementById('tourney-count');

const tourneyBracketPanel = document.getElementById('tourney-bracket');
const tourneyRegistrationPanel = document.getElementById('tourney-registration');
const playNextMatchBtn = document.getElementById('play-next-match-btn');
const bracketContainer = document.getElementById('bracket-container');
const abandonTourneyBtn = document.getElementById('abandon-tourney-btn');

function updateTourneySelects() {
    const validTeams = myTeams.filter(t => t.members.length > 0);
    const options = validTeams.map(t => `<option value="${t.id}">${t.name} (${t.members.length} PKMN)</option>`).join('');
    if(tourneyTeamSelect) tourneyTeamSelect.innerHTML = '<option value="">-- Seleziona Squadra --</option>' + options;
}

if(addTourneyPlayerBtn) {
    addTourneyPlayerBtn.addEventListener('click', () => {
        if (tourneyPlayers.length >= 10) return alert('Hai raggiunto il limite massimo di 10 giocatori!');
        const pName = tourneyPlayerName.value.trim();
        const tId = tourneyTeamSelect.value;
        
        if (!pName) return alert('Inserisci un nome giocatore alfanumerico!');
        if (!tId) return alert('Seleziona una squadra per iscriverlo!');
        
        const teamObj = myTeams.find(t => t.id == tId);
        tourneyPlayers.push({ name: pName, team: teamObj });
        tourneyPlayerName.value = '';
        
        renderTourneyPlayers();
    });
}

function renderTourneyPlayers() {
    tourneyCountSpn.innerText = tourneyPlayers.length;
    tourneyPlayersList.innerHTML = tourneyPlayers.map((p, idx) => `
        <div class="tourney-player-row">
            <div><b>${p.name}</b> combatte con <i>${p.team.name}</i></div>
            <button onclick="removeTourneyPlayer(${idx})">X</button>
        </div>
    `).join('');
    
    startTourneyBtn.disabled = tourneyPlayers.length < 4;
}

window.removeTourneyPlayer = function(idx) {
    tourneyPlayers.splice(idx, 1);
    renderTourneyPlayers();
};

if(startTourneyBtn) {
    startTourneyBtn.addEventListener('click', () => {
        // Randomizza i seed mescolando i giocatori
        tourneyPlayers.sort(() => Math.random() - 0.5);
        
        let n = tourneyPlayers.length;
        let nextPower = 1;
        while(nextPower < n) nextPower *= 2;
        let byes = nextPower - n; // Passaggi automatici del turno (squadre dispari e fuori potenze di 2)
        
        tourneyMatchesQueue = [];
        tourneyRoundWinners = [];
        tourneyRoundNum = 1;

        let queueIdx = 0;
        
        while (queueIdx < tourneyPlayers.length) {
            if (byes > 0) {
                tourneyMatchesQueue.push({ p1: tourneyPlayers[queueIdx], p2: null, isFreePass: true });
                byes--;
                queueIdx++;
            } else {
                if (queueIdx + 1 < tourneyPlayers.length) {
                    tourneyMatchesQueue.push({ p1: tourneyPlayers[queueIdx], p2: tourneyPlayers[queueIdx+1], isFreePass: false });
                    queueIdx += 2;
                } else {
                    tourneyMatchesQueue.push({ p1: tourneyPlayers[queueIdx], p2: null, isFreePass: true });
                    queueIdx++;
                }
            }
        }
        
        tourneyRegistrationPanel.classList.add('hidden');
        tourneyBracketPanel.classList.remove('hidden');
        renderTourneyBracket();
    });
}

function computeNextRound() {
    if (tourneyRoundWinners.length === 1) {
        document.getElementById('tourney-round-title').innerHTML = `<span style="color:#f39c12; font-size:1.5rem">VINCITORE ASSOLUTO DEL TORNEO: ${tourneyRoundWinners[0].name.toUpperCase()}!</span>`;
        playNextMatchBtn.classList.add('hidden');
        return;
    }
    
    tourneyRoundNum++;
    tourneyMatchesQueue = [];
    let pList = [...tourneyRoundWinners];
    tourneyRoundWinners = [];
    
    for (let i = 0; i < pList.length; i += 2) {
        const player1 = pList[i];
        const player2 = pList[i+1] || null;
        if(player2) tourneyMatchesQueue.push({ p1: player1, p2: player2, isFreePass: false });
        else tourneyMatchesQueue.push({ p1: player1, p2: null, isFreePass: true });
    }
    
    renderTourneyBracket();
}

function renderTourneyBracket() {
    let phaseName = `Round ${tourneyRoundNum}`;
    if (tourneyMatchesQueue.length === 4) phaseName = "Quarti di Finale";
    if (tourneyMatchesQueue.length === 2) phaseName = "Semifinale";
    if (tourneyMatchesQueue.length === 1) phaseName = "Finale Assoluta";
    
    document.getElementById('tourney-round-title').innerText = phaseName;
    
    const unplayedMatches = tourneyMatchesQueue.filter(m => !m.completed);
    
    if (unplayedMatches.length === 0) {
        computeNextRound();
        return;
    }
    
    bracketContainer.innerHTML = tourneyMatchesQueue.map((m, idx) => {
        if(m.isFreePass) {
            return `
            <div class="bracket-match" style="opacity:0.5">
                <h3>Match ${idx+1} [A Tavolino]</h3>
                <div class="bracket-competitor winner">${m.p1.name} avanza gratuitamente!</div>
            </div>`;
        }
        
        const cClass = m.completed ? "" : "active-match";
        const wClass = m.winner === 1 ? "winner" : (m.completed ? "loser" : "");
        const w2Class = m.winner === 2 ? "winner" : (m.completed ? "loser" : "");
        
        return `
        <div class="bracket-match ${cClass}">
            <h3>Match ${idx+1}</h3>
            <div class="bracket-competitor ${wClass}">${m.p1.name} <small>(${m.p1.team.name})</small></div>
            <div class="bracket-vs">VS</div>
            <div class="bracket-competitor ${w2Class}">${m.p2.name} <small>(${m.p2.team.name})</small></div>
        </div>`;
    }).join('');
    
    playNextMatchBtn.disabled = false;
}

if(playNextMatchBtn) {
    playNextMatchBtn.addEventListener('click', () => {
        for(let m of tourneyMatchesQueue) {
            if (!m.completed && m.isFreePass) {
                m.completed = true;
                m.winner = 1;
                tourneyRoundWinners.push(m.p1);
                renderTourneyBracket();
                return; 
            }
        }
        
        const nextMatch = tourneyMatchesQueue.find(m => !m.completed && !m.isFreePass);
        if(nextMatch) {
            document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
            document.getElementById('battle-view').classList.remove('hidden');
            document.getElementById('battle-setup').classList.add('hidden');
            
            battleState.isLeagueEngine = false; // Disabilita per non fare confusione
            battleState.isTournamentEngine = true;
            battleState.tourneyMatchRef = nextMatch;
            
            const p1Data = { name: nextMatch.p1.name, members: [...nextMatch.p1.team.members] };
            const p2Data = { name: nextMatch.p2.name, members: [...nextMatch.p2.team.members] };
            
            initBattle(p1Data, p2Data);
        }
    });
}

if(abandonTourneyBtn) {
    abandonTourneyBtn.addEventListener('click', () => {
        if(confirm('Vuoi ritirare il tabellone e svuotare il torneo attuale?')) {
            tourneyPlayers = [];
            tourneyRegistrationPanel.classList.remove('hidden');
            tourneyBracketPanel.classList.add('hidden');
            playNextMatchBtn.classList.remove('hidden');
            renderTourneyPlayers();
        }
    });
}

// Kickoff
initApp();
