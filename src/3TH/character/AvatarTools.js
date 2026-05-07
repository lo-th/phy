import {
	FileLoader
} from 'three';

import { Pool } from '../Pool.js';

export const AvatarTools = {

	clips : [],
	clipName : [],

	loadCompactAnimations: async ( url, callback ) => {

		const loader = new FileLoader();
	    loader.responseType = 'arraybuffer'
	    const data = await loader.loadAsync( url );

	    const result = Pool.decompress(data)

        const anim = JSON.parse(result);
        for(let c in anim){
            AvatarTools.clips.push( THREE.AnimationClip.parse( anim[c] ) );
            AvatarTools.clipName.push( anim[c].name )
        }
        callback();

	},

}