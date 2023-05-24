var current, mw, s1, s2, rr = 0, w1, w2, vehicle;

function demo() {

    phy.log('under construction')

    phy.set({ 
        substep:16, 
        gravity:[0,-10,0] 
    })


    phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], friction:0.2, restitution:0.3, visible:false });

   // phy.add({ type:'box', name:'f1', size:[ 5,0.2,2 ], pos:[5,0.1,3], friction:0.9, restitution:0 })
   // phy.add({ type:'box', name:'f2', size:[ 5,0.2,2 ], pos:[5,0.1,-3], friction:0.9, restitution:0 })

    /*var gw = new THREE.CylinderGeometry( 0.3, 0.3, 0.3, 16, 1 );
    gw.rotateZ( -Math.PI * 0.5 );
    mw = new THREE.Mesh( gw )*/

    testCar( 0, [ 0,4,0 ] );

    //phy.follow('chassis0', { direct:true, simple:true })

    // update after physic step
    phy.setPostUpdate ( update )


}


function testCar ( n, pos ){

    current = n

    var body = phy.add({ 
        type:'box', 
        name:'chassis'+n, 
        pos:pos, 
        size:[2, 1, 4],  
        density:200, 
        friction:0.2, 
        restitution:0.3, 
        neverSleep:true, 
        massCenter:[0,-0.2,0]
    });

    vehicle = new RaycastVehicle({
        chassis: body,
    })

    const wheelPositions = [
        new THREE.Vector3(-0.95,0,-1.8),
        new THREE.Vector3(0.95,0,-1.8),
        new THREE.Vector3(-0.95,0,1.8),
        new THREE.Vector3(0.95,0,1.8)
    ]

    const options = {
        radius: 0.5,
        directionLocal: new THREE.Vector3(0, -1, 0),
        suspensionStiffness: 30,
        suspensionRestLength: 0.8,
        frictionSlip: 4,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.001,
        axleLocal: new THREE.Vector3(1, 0, 0),
        chassisConnectionPointLocal: new THREE.Vector3(1, 1, 0),
        maxSuspensionTravel: 0.3
    }

    wheelPositions.forEach( positionLocal => {
        options.chassisConnectionPointLocal.copy( positionLocal )
        vehicle.addWheel( options )
    })

   

}



function update () {

    vehicle.updateVehicle()


}

class RaycastVehicle{

    constructor( o ){

        this.chassisBody = o.chassis;
        this.wheelInfos = [];
        this.sliding = false;
        this.world = null;
        this.indexRightAxis = typeof(o.indexRightAxis) !== 'undefined' ? o.indexRightAxis : 0;
        this.indexForwardAxis = typeof(o.indexForwardAxis) !== 'undefined' ? o.indexForwardAxis : 2;
        this.indexUpAxis = typeof(o.indexUpAxis) !== 'undefined' ? o.indexUpAxis : 1;
        this.rays = []

    }

    addWheel ( o={} ){
    
        let info = new WheelInfo(o);
        let index = this.wheelInfos.length;
        this.wheelInfos.push(info);

        this.rays.push( 
            phy.add({ 
                type:'ray', 
                name:this.chassisBody.name+'_wheel_'+index, 
                begin:info.chassisConnectionPointLocal.toArray(), 
                end:[info.chassisConnectionPointLocal.x,-5, info.chassisConnectionPointLocal.z], 
                callback:info.up, 
                visible:true, 
                parent:this.chassisBody 
            }
        )
)
        return index;

    }

    setSteeringValue(value, wheelIndex){
        let wheel = this.wheelInfos[wheelIndex];
        wheel.steering = value;
    }

    applyEngineForce(value, wheelIndex){
        this.wheelInfos[wheelIndex].engineForce = value;
    }

    setBrake(brake, wheelIndex){
        this.wheelInfos[wheelIndex].brake = brake;
    }

    updateVehicle(timeStep){

        let wheelInfos = this.wheelInfos;
        let numWheels = wheelInfos.length;
        let chassisBody = this.chassisBody;

        /*for (let i = 0; i < numWheels; i++) {
            this.updateWheelTransform(i);
        }*/





    }


    updateWheelTransformWorld(wheel){
        /*wheel.isInContact = false;
        var chassisBody = this.chassisBody;
        const transform = bodyTransform(chassisBody, new Matrix())
        Vector3.TransformCoordinatesToRef(wheel.chassisConnectionPointLocal, transform, wheel.chassisConnectionPointWorld)
        Vector3.TransformNormalToRef(wheel.directionLocal, transform, wheel.directionWorld)
        Vector3.TransformNormalToRef(wheel.axleLocal, transform, wheel.axleWorld)*/
    }







}




const Utilsdefaults = (options, defaults) => {
    options = options || {};

    for(var key in defaults){
        if(!(key in options)){
            options[key] = defaults[key];
        }
    }

    return options;
};

class WheelInfo{
    constructor(options){
        options = Utilsdefaults(options, {
            chassisConnectionPointLocal: new THREE.Vector3(),
            chassisConnectionPointWorld: new THREE.Vector3(),
            directionLocal: new THREE.Vector3(),
            directionWorld: new THREE.Vector3(),
            axleLocal: new THREE.Vector3(),
            axleWorld: new THREE.Vector3(),
            suspensionRestLength: 1,
            suspensionMaxLength: 2,
            radius: 1,
            suspensionStiffness: 100,
            dampingCompression: 10,
            dampingRelaxation: 10,
            frictionSlip: 10000,
            steering: 0,
            rotation: 0,
            deltaRotation: 0,
            rollInfluence: 0.01,
            maxSuspensionForce: Number.MAX_VALUE,
            isFrontWheel: true,
            clippedInvContactDotSuspension: 1,
            suspensionRelativeVelocity: 0,
            suspensionForce: 0,
            skidInfo: 0,
            suspensionLength: 0,
            maxSuspensionTravel: 1,
            useCustomSlidingRotationalSpeed: false,
            customSlidingRotationalSpeed: -0.1
        });

        this.maxSuspensionTravel = options.maxSuspensionTravel;
        this.customSlidingRotationalSpeed = options.customSlidingRotationalSpeed;
        this.useCustomSlidingRotationalSpeed = options.useCustomSlidingRotationalSpeed;
        this.sliding = false;
        this.chassisConnectionPointLocal = options.chassisConnectionPointLocal.clone();
        this.chassisConnectionPointWorld = options.chassisConnectionPointLocal.clone();
        this.directionLocal = options.directionLocal.clone();
        this.directionWorld = options.directionLocal.clone();
        this.axleLocal = options.axleLocal.clone();
        this.axleWorld = options.axleLocal.clone();
        this.suspensionRestLength = options.suspensionRestLength;
        this.suspensionMaxLength = options.suspensionMaxLength;
        this.radius = options.radius;
        this.suspensionStiffness = options.suspensionStiffness;
        this.dampingCompression = options.dampingCompression;
        this.dampingRelaxation = options.dampingRelaxation;
        this.frictionSlip = options.frictionSlip;
        this.steering = 0;
        this.rotation = 0;
        this.deltaRotation = 0;
        this.rollInfluence = options.rollInfluence;
        this.maxSuspensionForce = options.maxSuspensionForce;
        this.engineForce = 0;
        this.brake = 0;
        this.isFrontWheel = options.isFrontWheel;
        this.clippedInvContactDotSuspension = 1;
        this.suspensionRelativeVelocity = 0;
        this.suspensionForce = 0;
        this.skidInfo = 0;
        this.suspensionLength = 0;
        this.sideImpulse = 0;
        this.forwardImpulse = 0;
        this.raycastResult = null//new PhysicsRaycastResult();
        //this.raycastResult.directionWorld = new THREE.Vector3()
        //this.worldTransform = new TransformNode("")
        //this.worldTransform.rotationQuaternion = new THREE.Quaternion()
        this.isInContact = false;
    }

    up( r ){

        this.isInContact = r.hit 

        if( this.isInContact ){
            this.suspensionLength = r.distance - this.radius;

        } else {

            this.suspensionLength = this.suspensionRestLength + this.maxSuspensionTravel;
            this.suspensionRelativeVelocity = 0.0;
            //this.raycastResult.hitNormalWorld.copyFrom(wheel.directionWorld).scaleInPlace(-1)
            this.clippedInvContactDotSuspension = 1.0;

        }


    }

    updateWheel( chassis ){

        var raycastResult = this.raycastResult;
    
        /*if (this.isInContact){
            var project= THREE.Vector3.Dot(raycastResult.hitNormalWorld, raycastResult.directionWorld);
            raycastResult.hitPointWorld.subtractToRef( bodyPosition(chassis, new Vector3()), relpos);
            velocityAt(chassis, relpos, chassis_velocity_at_contactPoint);
           // velocityAt(chassis, raycastResult.hitPointWorld, relpos);
            var projVel = THREE.Vector3.Dot(raycastResult.hitNormalWorld, chassis_velocity_at_contactPoint );
            if (project >= -0.1) {
                this.suspensionRelativeVelocity = 0.0;
                this.clippedInvContactDotSuspension = 1.0 / 0.1;
            } else {
                var inv = -1 / project;
                this.suspensionRelativeVelocity = projVel * inv;
                this.clippedInvContactDotSuspension = inv;
            }
    
        } else {
            // Not in contact : position wheel in a nice (rest length) position
            raycastResult.suspensionLength = this.suspensionRestLength;
            this.suspensionRelativeVelocity = 0.0;
            raycastResult.hitNormalWorld.copy(raycastResult.directionWorld).scaleInPlace(-1)
            this.clippedInvContactDotSuspension = 1.0;
        }*/
    }
}