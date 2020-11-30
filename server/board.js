function Field(num, line, side) {
    this.num = num;
    this.card = null;
    this.line = line;
    this.side = side;
    this.aheadNeighbor = null;
    this.behindNeighbor = null;
    
    this.buffs = [];
}

function Board(userName, Cards) {
    this.owner = userName
    this.cardsBase = Cards,
    this.deck = [...Cards],
    this.discard = [],
    this.hand = [],
    this.banEnemyRemovingBodies = false,
    this.deadBodiesCanAttack = false,
    this.instantKill = false,
    this.freeRecrut = false,
    this.freeClearCorpse = false,
    this.freeHeroMove = false,
    this.showFirstCardOnDeck = false,
    this.fields = [
        new Field(1, "rear", "left"),
        new Field(2, "rear", "middle"),
        new Field(3, "rear", "right"),
        new Field(4, "flank", "left"),
        new Field(5, "flank", "middle"),
        new Field(6, "flank", "right"),
        new Field(7, "vanguard", "left"),
        new Field(8, "vanguard", "middle"),
        new Field(9, "vanguard", "right"),
    ];
    this.column = {
        left: { vanguard: this.fields[6], flank: this.fields[3], rear: this.fields[0] },
        middle: { vanguard: this.fields[7], flank: this.fields[4], rear: this.fields[1] },
        right: { vanguard: this.fields[8], flank: this.fields[5], rear: this.fields[2] }
    };
    this.row = {
        vanguard: { left: this.fields[6], middle: this.fields[7], right: this.fields[8] },
        flank: { left: this.fields[3], middle: this.fields[4], right: this.fields[5] },
        rear: { left: this.fields[1], middle: this.fields[1], right: this.fields[2] }
    }
    this.unitPerks = [];
    this.endTurnPerks = [];

    //   this.cardsProperties = new Map(),
    /*
      1 4 7
      2 5 8
      3 6 9
    */
    this.fields[0].aheadNeighbor = this.fields[3];  // 1->4
    this.fields[1].aheadNeighbor = this.fields[4];  // 2->5
    this.fields[2].aheadNeighbor = this.fields[5];  // 3->6
    this.fields[3].aheadNeighbor = this.fields[6];  // 4->7
    this.fields[3].behindNeighbor = this.fields[0]; // 4->1
    this.fields[4].aheadNeighbor = this.fields[7];  // 5->8
    this.fields[4].behindNeighbor = this.fields[1]; // 5->2
    this.fields[5].aheadNeighbor = this.fields[8];  // 6->9
    this.fields[5].behindNeighbor = this.fields[2]; // 6->3
    this.fields[6].behindNeighbor = this.fields[3]; // 7->4
    this.fields[7].behindNeighbor = this.fields[4]; // 8->5
    this.fields[8].behindNeighbor = this.fields[5]; // 9->6

}
Board.prototype = {
    getLineSideByFieldNum: function (fieldNum) {
        switch (+fieldNum) {
            case 1: line = "rear"; side = "left"; break;
            case 2: line = "rear"; side = "middle"; break;
            case 3: line = "rear"; side = "right"; break;
            case 4: line = "flank"; side = "left"; break;
            case 5: line = "flank"; side = "middle"; break;
            case 6: line = "flank"; side = "right"; break;
            case 7: line = "vanguard"; side = "left"; break;
            case 8: line = "vanguard"; side = "middle"; break;
            case 9: line = "vanguard"; side = "right"; break;
            default: break;
        }
        return [line, side];
    },
    getFieldNumByLineSide: function (line, side){
        let field = this.fields.find( f => ((f.side === side)&&(f.line === line)) )
        return field.num
    },
    shuffleDeck: function () {
        let m = this.deck.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = this.deck[m];
            this.deck[m] = this.deck[i];
            this.deck[i] = t;
        }
        return true;
    },

    pushCurrentCardsFromDeckToHand: function (cardId) {
        let index_card = this.deck.findIndex( c => c.id === cardId)
        let card = this.deck.splice(index_card, 1)[0];
        this.hand.push(card)

        return
    },
    getBodiesArray: function (){
        return this.fields.filter( f => {
            if(f.card !== null){
                if(f.num !== 5){
                    return f.card.isAlive === 0
                }
                return false
            } else {
                return false
            }
        });
    },
    pushCardsFromDeckToHand: function (count = 1) {
        let arrLength = 0;
        for (let i = 0; i < count; i++) {
            arrLength = this.hand.push(this.deck.shift());
        }
        return this.hand[arrLength - 1];
    },

    getNodeByNum: function (num) {
        return this.fields.filter(node => node.num === num);
    },

    getNodeByCardId: function (id) {
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].card) {
                if (this.fields[i].card.id == id) {
                    return this.fields[i];
                }
            }
        }
        return false;
    },
    canRangeAtk(field){
        return field.buffs.some(buff => buff[1] === "ranged");
    },
    removeCardFromHandById: function (cardId) {
        this.hand.splice(this.hand.findIndex(card => card.id === cardId), 1);
    },

    addAbility: function (cardId, field_num) {
        let lineAbil = null;
        let c = this.cardsBase[cardId - 1];
        [line, side] = this.getLineSideByFieldNum(field_num);
        lineAbil = (field_num == 5) ? c['leader_perk'] : c['ability'][line];
        if (field_num === 5) {
            switch (lineAbil) {
                case "#alchemist":
                case "#healer":
                    return { gameEvent: "perksBeforeCheckloss", perk: { user: this.owner, cardId: c.id, action: lineAbil } }
                case "#planestalker":
                    this.fields.forEach(field => {
                        if (field.num === 5) {
                            this.fields[4].buffs.push([c.id, "ranged"]);
                        } else {
                            field.buffs.push([c.id, "intercept"]);
                        }
                    });
                    break;
                case "#scientist":
                    return { gameEvent: "addActionPoint" }
                case "#fighter":
                    this.fields.forEach(field => {
                        if (field.num !== 5) {  
                            field.buffs.push([c.id, "moreMeleeDmg:3"]);
                        }
                    });
                    break
                case "#priestsess":
                    this.fields.forEach(field => field.buffs.push([c.id, "specialMarker"]));
                    break
                case "#doppelganger":
                    return { gameEvent: "mirrorLeader", perk: { user: this.owner, cardId: c.id, action: lineAbil } }
                case "#berserk":
                    // >>>>??????????
                    break
                case "#vampire":
                    this.fields.forEach(field => {
                        field.buffs.push([c.id, "lifelink"]);
                    });
                    break
                case "#witch":
                    this.deadBodiesCanAttack = true
                    break
                case "#assassin":
                    this.instantKill = true
                    break
                case "#dragonmage":
                    this.banEnemyRemovingBodies = true
                    break
                case "#illusionist":
                    // >>>>??????????'Когда противник использует ближнюю атаку, Вы решаете, какую цель он достигнет. Цель должна быть доступна для ближней атаки.'
                    break
                case "#templar":
                    // >>>>??????????'Герои в этом отряде получают +5 к силе в том случае, если получили повреждения в течение этой фазы.'
                    break
                case "#mascot":
                    // >>>>??????????'При найме героя в этом отряде, этот герой может сразу же атаковать, не затрачивая действия в этой фазе. Данная способность не работает в первом раунде.'
                    break
                case "#oracle":
                    // >>>>??????????'Противник играет с открытыми картами.'
                    break
                case "#mystic":
                    // >>>>??????????'Первые 2 приказа в каждой фазе не затрачивают действие.'
                    break
                case "#paladin":
                    this.freeClearCorpse = true
                    this.freeHeroMove = true
                    break
                case "#pyromancer":
                    this.fields.forEach(field => {
                        if (field.num !== 5) {  
                            field.buffs.push([c.id, "pyromancer_buff"]);
                        } else {
                            field.buffs.push([c.id, 'range']);
                        }
                    });
                    

                    break
                case "#summoner":
                    this.freeRecrut = true
                    break
                case "#gunner":
                    // 'Атака этого лидера дальняя. при использовании приказа нанесите 3 повреждения любому герою.'
                    this.fields[4].buffs.push([c.id, 'range']);
                    // add trigger on play order
                    break
                case "#knight":
                    this.fields.forEach(field => {
                        field.buffs.push([c.id, "lessDmg:2"]);
                    });
                    break
                case "#homunculus":
                    this.fields.forEach(field => {
                        if (field.num !== 5) {  
                            field.buffs.push([c.id, "preventLethalDmg"]);
                        }
                    });
                    break
                default:
                    this.fields[4].buffs.push([c.id, lineAbil]);
                    break;
            }
            
        } else {
            lineAbil.forEach(abil => {
                if (abil.type === "spell") {
                    this.fields[field_num - 1].card.spell = abil.spell;
                }
                if (abil.type === "passive") {
                    if (abil.target === "self") {
                        this.fields[field_num - 1].buffs.push([c.id, abil.action]);
                    }
                    if (abil.target === "leader") {
                        this.fields[4].buffs.push([c.id, abil.action]);
                    }
                    // "#oracle" rear
                    if(abil.target === "player unit"){
                        this.fields[field_num - 1].buffs.push([c.id, abil.action]);
                        this.showFirstCardOnDeck = true
                    }
                    if(abil.target === "forerunner"){
                        this.fields[field_num - 1].aheadNeighbor.buffs.push([c.id, abil.action]);
                    }
                }
            });
        }
    },

    removeAbility: function (Cards, cardId, field_num) {
        let lineAbil = null;
        let c = Cards[cardId - 1];
        [line, side] = this.getLineSideByFieldNum(field_num);
        lineAbil = c['ability'][line];
        lineAbil.forEach(abil => {
            if (abil.type === "spell") {
                this.fields[field_num - 1].card.spell = "";
            }
            if (abil.type === "passive") {
                if (abil.target === "self") {
                    this.fields[field_num - 1].buffs = this.fields[field_num - 1].buffs.filter(buff => buff[0] !== cardId);
                }
                if (abil.target === "leader") {
                    this.fields[4].buffs = this.fields[4].buffs.filter(buff => buff[0] !== cardId);
                }
                //  "#oracle" rear
                if(abil.target === "player unit"){
                    this.fields[field_num - 1].buffs = this.fields[field_num - 1].buffs.filter(buff => buff[0] !== cardId);
                    this.showFirstCardOnDeck = false
                }

                if(abil.target === "forerunner"){
                    this.fields[field_num - 1].aheadNeighbor.buffs = this.fields[field_num - 1].aheadNeighbor.buffs.filter(buff => buff[0] !== cardId);                
                }
            }
        });
    },
    addCardOnTable: function (cardId, field_num) {
        let line, side = "";
        this.removeCardFromHandById(cardId);
        [line, side] = this.getLineSideByFieldNum(field_num);
        let c = this.cardsBase[cardId - 1];
        this.fields[field_num - 1].card = new Object({
            id: c.id,
            atk: (field_num == 5) ? c.leader_atk : c.atk,
            def: (field_num == 5) ? c.leader_def : c.def,
            // atkType: "melee",
            blood: 0,
            isAlive: 1,
            locate: field_num,
            line: line, // not needed in future
            side: side, // not needed in future
            spell: "",
            buffs: [],
        });
        this.column[side][line] = this.fields[+field_num - 1].card;
        this.row[line][side] = this.fields[+field_num - 1].card;


        return this.addAbility(cardId, field_num);

    },
}

module.exports = Board