import { math } from '../math.js';
import { root } from '../root.js';

import {  } from './modules/AnimationPack.js';
import { BVHLoader } from '../../jsm/loaders/BVHLoader.js';



function Animator( baseMesh, offsets, isBestAlign, callback, noReload ) {

	this.clips = {};

	this.mesh = baseMesh.clone( root.mat.skin, offsets, isBestAlign );
	this.bvh = new BVHLoader();
    this.bvh.addModel( this.mesh );

    if( noReload ){

        callback()

    } else {

        this.callback = callback;
        this.loadStartAnimations();

    }

}


Animator.prototype = {

	clear: function () {

		this.clips = {};
		root.animator = null;
		
	},

	loadStartAnimations: function () {

		this.anim = ['idle', 'walk', 'run', 'jump', 'right_turn', 'left_turn', 't_pose', 'victory', 'victory2'];
        this.guns = [ 
        'talon_idle_combat', 'talon_idle_relax', 'talon_shoot', 'talon_aim',
        'rifle_idle_combat', 'rifle_idle_relax', 'rifle_aim',
        'smg_idle_combat', 'smg_idle_relax', 'smg_shoot', 'smg_reload', 'smg_aim',
        'snipper_idle_combat', 'snipper_idle_relax', 'snipper_aim',
        ];
        this.zombi = ['z_idle', 'z_idle2', 'z_run', 'z_walk', 'z_walk2', 'z_standup', 'z_attack', 'z_die', 'z_hit', 'z_biting'];
		
        this.noLoop = ['smg_reload', 'talon_aim', 'rifle_aim',  'smg_aim', 'snipper_aim'];


        let compact = [ 'full_rifle', 'mobility', 'gun' ];

        

        let urls = [];
        
        let i = this.anim.length;
        while(i--) urls.push( this.anim[i] + '.bvh' );

        i = this.guns.length;
        while(i--) urls.push( 'fps/' + this.guns[i] + '.bvh' );

        i = this.zombi.length;
        while(i--) urls.push( 'zombi/' + this.zombi[i] + '.bvh' );
        

        i = compact.length;
        while( i-- ) urls.push( compact[i] + '.hex' );

        //root.view.clearTmpPool();

        //let self = this;
        //root.load( urls, function(){ self.onLoaded() } );

        root.view.load( urls, function(){ this.onLoaded() }.bind(this) );

    },

    onLoaded: function () {

        //console.log('Animation loaded !!')

        this.mesh.pose();

        let loop = 1;
        let i = this.anim.length;
        while( i-- ){ 
            loop = this.noLoop.indexOf( this.anim[i]) !==-1 ? 0 : 1;
            this.addAnimation( { name:this.anim[i], loop:loop });
        }

        // new gun animation

        i = this.guns.length;
        while( i-- ){ 

            loop = this.noLoop.indexOf( this.guns[i]) !==-1 ? 0 : 1;
            this.addAnimation( { name:this.guns[i], loop:loop, restrict:[ 'hip', 'spine', 'r_arm', 'l_arm', 'r_hand', 'l_hand', 'head' ], collapse: [ ['hip','abdomen'] ] });

        }

        // zombi animation

        i = this.zombi.length;
        while( i-- ){ 

            loop = i>5 ? 0 : 1;
            this.addAnimation( { name:this.zombi[i], loop:loop });

        }

        this.addAnimation( { name:'gun', seq:gun_seq, restrict:[ 'spine', 'r_arm', 'l_arm', 'r_hand', 'l_hand', 'head' ] });
        
        this.addAnimation( { name:'full_rifle', seq:full_rifle_seq, restrict:[ 'hip',/*'spine',*/'l_leg', 'r_leg'], prefix:'m1_' });

        this.addAnimation( { name:'mobility', seq:mobility_seq, restrict:[ 'hip', 'spine','l_leg', 'r_arm', 'l_arm', 'r_leg'], prefix:'m0_' });




        this.callback();

    },

    addAnimation: function ( o, callback ) {

        let data = o.data !== undefined ? o.data : root.getPool( o.name );

        if( !data ) return;

        o.clips = this.clips;

        this.bvh.convertToClip( this.mesh, this.bvh.parseData( data ), o );

        if( callback !== undefined ) callback();
        
    },



}



export { Animator };


var mobility_seq = [

    // temp
    ['crouch_idle', 246, 336, 1,0 ],
    ['idle', 1004, 1127, 1,0 ],

    //--

    ['crouch_B', 0, 36, 1,0 ],
    ['crouch_BL', 41, 77, 1,0 ],
    ['crouch_BR', 82, 118, 1,0 ],
    ['crouch_F', 123, 159, 1,0 ],
    ['crouch_FL', 164, 200, 1,0 ],
    ['crouch_FR', 205, 241, 1,0 ],
    ['crouch_L', 486, 522, 1,0 ],
    ['crouch_R', 527, 563, 1,0 ],

    ['crouch_idle_1', 246, 336, 1,0 ],
    ['crouch_idle_2', 341, 481, 1,0 ],

    ['jog_B', 568, 592, 1,0 ],
    ['jog_BL', 597, 621, 1,0 ],
    ['jog_BR', 626, 650, 1,0 ],
    ['jog_F', 655, 679, 1,0 ],
    ['jog_FL', 684, 708, 1,0 ],
    ['jog_FR', 713, 737, 1,0 ],
    ['jog_L', 742, 766, 1,0 ],
    ['jog_R', 771, 795, 1,0 ],

    ['run_F', 894, 911, 1,0 ],
    ['run_FL', 916, 933, 1,0 ],
    ['run_FR', 938, 955, 1,0 ],
    ['run_L', 960, 977, 1,0 ],
    ['run_R', 982, 999, 1,0 ],

    ['jump_air', 800, 860, 1,0 ],
    ['jump_up', 865, 889, 1,0 ],

    ['stand_idle_1', 1004, 1127, 1,0 ],
    ['stand_idle_2', 1132, 1316, 1,0 ],

    ['walk_B', 1339, 1375, 1,0 ],
    ['walk_BL', 1380, 1416, 1,0 ],
    ['walk_BR', 1421, 1457, 1,0 ],
    ['walk_F', 1462, 1498, 1,0 ],
    ['walk_FL', 1503, 1539, 1,0 ],
    ['walk_FR', 1544, 1580, 1,0 ],
    ['walk_L', 1585, 1621, 1,0 ],
    ['walk_R', 1626, 1662, 1,0 ],

    // pose

    ['look_center', 1321, 1322, 1,0 ],
    ['look_down', 1327, 1328, 1,0 ],
    ['look_up', 1333, 1334, 1,0 ],

]

var gun_seq = [

    // idle

    ['w1_aim_idle', 1682, 1742, 1,0 ],
    ['w1_relax_idle', 1747, 1807, 1,0 ],

    ['w2_aim_idle', 1812, 1910, 1,0 ],
    ['w2_aim_idle_2', 1915, 2035, 1,0 ],
    ['w2_relax_idle', 2040, 2138, 1,0 ],
    ['w2_relax_idle_2', 2143, 2284, 1,0 ],

    // weapon gun

    ['w1_stand_to_aim', 0, 30, 0,0 ],
    ['w1_aim_to_stand', 35, 79, 0,0 ],

    ['w1_reload', 84, 134, 0,0,  ],
    ['w1_to_w2', 139, 195, 0,0 ],
    ['w1_unjam', 200, 260, 0,0 ],

    ['w1_fire_loop', 265, 297, 1,0 ],
    ['w1_fire_power', 302, 332, 0,0 ],
    ['w1_fire_single', 337, 367, 0,0 ],

    ['w1_relax_reload', 412, 472, 0,0 ],
    ['w1_relax_unjam', 477, 563, 0,0 ],
    ['w1_to_w2_rix', 568, 631, 0,0 ],

    // weapon rifle 

    ['w2_stand_to_aim', 636, 671, 0,0 ],
    ['w2_aim_to_stand', 676, 721, 0,0 ],

    ['w2_reload', 726, 786, 0,0 ],
    ['w2_to_w1', 791, 847, 0,0 ],
    ['w2_unjam', 852, 1031, 0,0 ],

    ['w2_fire_burst', 1036, 1066, 1,0 ],
    ['w2_fire_loop', 1071, 1084, 1,0 ],
    ['w2_fire_power', 1089, 1131, 0,0 ],
    ['w2_fire_power_2', 1136, 1178, 0,0 ],
    ['w2_fire_single', 1183, 1213, 0,0 ],

    ['w2_relax_reload', 1248, 1318, 0,0 ],
    ['w2_relax_unjam', 1323, 1510, 0,0 ],
    ['w2_stand_to_aim_rix', 1515, 1561, 0,0 ],
    ['w2_aim_to_stand_rix', 1566, 1609, 0,0 ],
    ['w2_to_w1_rix', 1614, 1677, 0,0 ],

    // point of view pose

    /*['w1_aim_p_0', 372, 373, 1,0 ],
    ['w1_aim_d_45', 380, 381, 1,0 ],
    ['w1_aim_d_90', 388, 389, 1,1, 'w1_aim_p_0' ],
    ['w1_aim_u_45', 396, 397, 1,0 ],
    ['w1_aim_u_90', 404, 405, 1,1, 'w1_aim_p_0' ],

    ['w2_aim_p_0', 1218, 1219, 1,0 ],
    ['w2_aim_d_45', 1224, 1225, 1,0 ],
    ['w2_aim_d_90', 1230, 1231, 1,0 ],
    ['w2_aim_u_45', 1236, 1237, 1,0 ],
    ['w2_aim_u_90', 1242, 1243, 1,0 ],

    ['w1_relax_p_0', 2289, 2290, 1,0 ],
    ['w1_relax_d_90', 2297, 2298, 1,0 ],
    ['w1_relax_u_90', 2305, 2306, 1,0 ],

    ['w2_relax_p_0', 2313, 2314, 1,0 ],
    ['w2_relax_d_90', 2319, 2320, 1,0 ],
    ['w2_relax_u_90', 2325, 2326, 1,0 ],*/

];

var death_seq = [

    ['gut_shot', 0, 139, 0,0 ],
    ['guts_fallout', 144, 396, 0,0 ],
    ['hit_dazed', 401, 496, 0,0 ],
    ['hit_head_spin', 501, 575, 0,0 ],
    ['hit_left_chest', 580, 676, 0,0 ],
    ['hit_left_slow', 681, 869, 0,0 ],
    ['hit_mid_right', 874, 938, 0,0 ],
    ['hit_slow_bleed', 943, 1125, 0,0 ],

    ['shot_chest', 1130, 1257, 0,0 ],
    ['shot_in', 1262, 1447, 0,0 ],
    ['shot_left', 1452, 1542, 0,0 ],
    ['shot_mid', 1547, 1779, 0,0 ],
    ['shot_right', 1784, 1919, 0,0 ],
    ['shot_slow', 1924, 2146, 0,0 ],

    ['shoulder_crawl', 2151, 2410, 0,0 ],
    ['walk_decked', 2415, 2517, 0,0 ],

]

// old 

var full_rifle_seq = [

    ['crouch_death_front', 86, 143, 0, 0 ],
    ['death_back_head', 148,259, 0, 0 ],
    ['death_front_head', 264, 349, 0,0 ],
    ['death_right', 354, 453, 0,0 ],
    ['death_back', 458, 547, 0,0 ],
    ['death_front', 552, 655, 0,0 ],

    ['idle', 660, 722, 1,0 ],
    ['idle_crouch_aiming', 727, 790, 1,0 ],
    ['crouch_idle', 795, 858, 1,0 ],
    ['idle_rifle', 863, 926, 1,0 ],

    ['jump_down', 931, 951, 0,0 ],
    ['jump_loop', 956, 984, 1,0 ],
    ['jump_up', 989, 1005, 0,0 ],

    //---- 15 frame

    ['run_B', 1050, 1065, 1,0 ],
    ['run_F', 1110, 1125, 1,0 ],
    ['run_L', 1130, 1145, 1,0 ],
    ['run_R', 1150, 1165, 1,0 ],
    ['run_BL', 1010, 1025, 1,0 ],
    ['run_BR', 1030, 1045, 1,0 ],
    ['run_FL', 1070, 1085, 1,0 ],
    ['run_FR', 1090, 1105, 1,0 ],

    //---- 15 frame

    ['jog_B', 1210, 1225, 1,0 ],
    ['jog_F', 1270, 1285, 1,0 ],
    ['jog_L', 1290, 1305, 1,0 ],
    ['jog_R', 1310, 1325, 1,0 ],
    ['jog_BL', 1170, 1185, 1,0 ],
    ['jog_BR', 1190, 1205, 1,0 ],
    ['jog_FL', 1230, 1245, 1,0 ],
    ['jog_FR', 1250, 1265, 1,0 ],
    
    //---- 30 frame

    ['crouch_B', 1575, 1605, 1,0 ],
    ['crouch_F', 1679, 1709, 1,0 ],
    ['crouch_L', 1714, 1744, 1,0 ],
    ['crouch_R', 1749, 1779, 1,0 ],
    ['crouch_BL', 1505, 1535, 1,0 ],
    ['crouch_BR', 1540, 1570, 1,0 ],
    ['crouch_FL', 1610, 1640, 1,0 ],
    ['crouch_FR', 1645, 1674, 1,0 ],

    //---- 30 frame

    ['walk_B', 1470, 1500, 1,0 ],
    ['walk_F', 1854, 1884, 1,0 ],
    ['walk_L', 1889, 1919, 1,0 ],
    ['walk_R', 1924, 1954, 1,0 ],
    ['walk_BL', 1400, 1430, 1,0 ],
    ['walk_BR', 1435, 1465, 1,0 ],
    ['walk_FL', 1784, 1814, 1,0 ],
    ['walk_FR', 1819, 1849, 1,0 ],

];