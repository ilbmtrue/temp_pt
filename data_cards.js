export class Card{
    constructor(id, name, atk, def, vanguard, flank, rear, special, l_name, l_special, l_atk, l_def){
        this.id = id;
        this.name = name;
        this.atk = atk;
        this.def = def;
        this.vanguard = van;
        this.flank = flank;
        this.rear = rear;
        this.special = special;
        this.l_name = l_name;
        this.l_atk = l_atk;
        this.l_def = l_def;
    }
}
const Cards = [
    {
        num: 1,
        name: 'Алхимик',
        img: '3',
        atk: 2,
        def: 4,
        vanguard: '',
        flank: '',
        rear: '',
        special: '',
        leader: 'Ликсис Ран Канда',
        leader_s: 'Боевое алхимическое подразделение',
        leader_atk: 2,
        leader_def: 17,
        leader_special: function (){
            return ['passive', ]
        },
    }
];


// module.exports = Cards;