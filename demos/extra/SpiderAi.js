

// https://github.com/anoochit/arduino-quadruped-robot
// https://www.youtube.com/watch?v=fvUhFBq7Z4g

//http://regishsu.blogspot.com/search/label/0.SpiderRobot%E8%9C%98%E8%9B%9B

/* Servos --------------------------------------------------------------------*/
// 12 servos for 4 legs

//   1 ____ 3
//   |      |
//   |  \/  | 
//   0 ____ 2 

//  6--5--7 ____ 13--11--12
//        |      |
//        |  \/  | 
//  3--2--4 ____ 10--8--9 

SpiderAi = ( solver ) => {
    return new SpiderRobot( solver )
}

class SpiderRobot {

    constructor ( solver ) {

        this.keep = 255

        this.solver = solver

        this.ready = true
        this.command = false

        this.action = 0
        this.old = -1

        this.countMax = 0
        this.count = 0
        this.currentCount = -1

        this.wantUpdate = false

        this.up = false

        this.pause = false
        this.waiting = false
        this.done = false

        this.site = [[0,0,0], [0,0,0], [0,0,0], [0,0,0]];
        this.servo = [ 0,0,0,0,  0,0,0,0,  0,0,0,0 ];
        this.servoOld = [ 0,0,0,0,  0,0,0,0,  0,0,0,0 ];
        //start serial for debug
        //Serial.begin(9600);
        //console.log("SpiderRobot starts initialization");

        this.todeg = 180 / Math.PI

        // Size of the robot
        this.length_a = 55;
        this.length_b = 77.5;
        this.length_c = 27.5;
        let length_side = 71;
        let z_absolute = -40//-28;
        // Constants for movement
        this.z_default = -50//-50 
        this.z_up = -30//-30
        this.z_boot = z_absolute;
        this.x_default = 62//62
        this.x_offset = 0;
        this.y_start = 0
        this.y_step = 40//40;
        this.y_default = this.x_default;

        //Constants for turn
        //temp length
        let temp_a = Math.sqrt(Math.pow(2 * this.x_default + length_side, 2) + Math.pow(this.y_step, 2));
        let temp_b = 2 * (this.y_start + this.y_step) + length_side;
        let temp_c = Math.sqrt(Math.pow(2 * this.x_default + length_side, 2) + Math.pow(2 * this.y_start + this.y_step + length_side, 2));
        let temp_alpha = Math.acos((Math.pow(temp_a, 2) + Math.pow(temp_b, 2) - Math.pow(temp_c, 2)) / 2 / temp_a / temp_b);
        //site for turn
        this.turn_x1 = (temp_a - length_side) / 2;
        this.turn_y1 = this.y_start + this.y_step / 2;
        this.turn_x0 = this.turn_x1 - temp_b * Math.cos(temp_alpha);
        this.turn_y0 = temp_b * Math.sin(temp_alpha) - this.turn_y1 - length_side;



        this.sonar_mode = false;
        this.freewalk_mode = false;
        this.a_dist = 25;
        this.timeout = null

        this.move = {
            SIT : -1,
            STAND : 0,
            FORWARD   : 1,
            BACKWARD  : 2,
            LEFT      : 3,
            RIGHT     : 4,
            SHAKE     : 5,
            WAVE      : 6,
            SONAR     : 7,
            FREEWALK  : 8,
            W_LEG_INIT  : 9,
        }


        

        //initialize default parameter
        this.set_site(0, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_boot);
        this.set_site(1, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_boot);
        this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_boot);
        this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_boot);

        

        ///this.copyAr()
        this.apply()

        //this.update()
        //start servo service
        //FlexiTimer2::set(20, servo_service);
        //FlexiTimer2::start();
        //console.log("Servo service ready");

       
        //initialize servos
        //this.servo_attach();
        //console.log("Servos initialized");
        //console.log("Robot initialization Complete");

        //pinMode(TRIGGER_PIN, OUTPUT); // Sets the trigPin as an Output
        //pinMode(ECHO_PIN, INPUT); // Sets the echoPin as an Input
    }

    start () {


        const fps = 1000 * (1/60)
        setInterval( this.update.bind(this), fps )

    }

    delay ( t ) {
        this.pause = true
        this.timeout = setTimeout( function(){ this.pause = false }.bind(this), t );
    }

    /*copySite(){
        for (let i = 0; i < 4; i++){
            for (let j = 0; j < 3; j++){
                this.site[i][j] = site_expect[i][j];
            }
        }
    }*/

    copyServo(){
        let i = 12
        while(i--) this.servoOld[i] = this.servo[i]
    }

    isSame(){
        let i = 12
        while(i--){ 
            if(this.servoOld[i] !== this.servo[i] ) return false
        }

        return true
        
    }


    /*
    - microservos service /timer interrupt function/50Hz
    - when set site expected,this function move the end point to it in a straight line
    - temp_speed[4][3] should be set before set expect site,it make sure the end point
    move in a straight line,and decide move speed.
    ---------------------------------------------------------------------------*/

    next(){

        //this.copySite()
        

        this.count++
        if( this.count >= this.countMax ) this.count = 0
    
        this.ready = true     

    }



    apply(){

        //
        
        if( this.ready ){ 
            let same = this.isSame()
            this.copyServo()
            //let same2 = this.isSame2()

           // if(!same)ff.push(servo)

            

            if(same) return
            this.ready = false
            this.solver.setAngles( this.servo, this.solver.speed ).then( this.next.bind(this) );

        }
        

    }

    update () {

        //if(this.pause) return

        //this.done = false

        //if( !this.waiting ) 
        this.action_cmd()
        //this.apply(dt)

        //if(!this.waiting && !this.done ) this.done = true
        //if(!this.waiting) return

        //this.sei();
        //let alpha, beta, gamma;
        

        /* for (let i = 0; i < 4; i++){
            /*for (let j = 0; j < 3; j++){
                if (Math.abs(this.site[i][j] - site_expect[i][j]) >= Math.abs(temp_speed[i][j])) this.site[i][j] += temp_speed[i][j];
                else this.site[i][j] = site_expect[i][j];
            }

            //this.cartesian_to_polar( this.site[i][0], this.site[i][1], this.site[i][2] );
            this.cartesian_to_polar( site_expect[i][0], site_expect[i][1], site_expect[i][2] );
            this.polar_to_servo(i);
        }

       if( this.wantUpdate && !this.waiting ){

            this.done = true
            this.wantUpdate = false
           
        }*/

        //console.log( this.done, this.waiting )

        //if(!this.waiting) 
        //console.log( servo, this.done )

        //this.setAngle( servo, move_speed )

        //rest_counter++;

    }


    wait_all_reach() {

        this.apply()

    }

    /*servo_attach () {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
                servo[i][j].attach(servo_pin[i][j]);
                this.delay(100);
            }
        }
    }

    servo_detach(){
        for (let i = 0; i < 4; i++){
            for (let j = 0; j < 3; j++){
                servo[i][j].detach();
                this.delay(100);
            }
        }
    }*/

    //- loop function

    loop(){
        //SCmd.readSerial();
        if (this.freewalk_mode==true){
            // free walk
            this.freewalk(this.a_dist);
        } else if (this.sonar_mode==true) {
            // sonar mode with manual control
            this.check_obstacle(this.a_dist);
        } 
    }

    check_obstacle ( dist ) {
        let ping_range;
        this.delay(50);
        //Serial.print("Ping: ");
        //Serial.print(sonar.ping_cm()); // Send ping, get distance in cm and print result (0 = outside set distance range)
        console.log("cm");
        ping_range = sonar.ping_cm();
        if ((ping_range<dist) && (ping_range!=0)) {
            // stand
            console.log("Wake up");
            this.stand();          
            // wave
            console.log("Shake");
            this.hand_shake(2);
            // turn
            //console.log("Turn");
            //turn_left(5);
            // sit
            console.log("Sit");
            this.sit();
        }
    }


    do_test() {

        console.log("Stand");
        this.stand();
        this.delay(2000);
        console.log("Step forward");
        this.step_forward(5);
        this.delay(2000);
        console.log("Step back");
        this.step_back(5);
        this.delay(2000);
        console.log("Turn left");
        this.turn_left(5);
        this.delay(2000);
        console.log("Turn right");
        this.turn_right(5);
        this.delay(2000);
        console.log("Hand wave");
        this.hand_wave(3);
        this.delay(2000);
        console.log("Hand shake");
        this.hand_shake(3);
        this.delay(2000);
        console.log("Body dance");
        this.body_dance(10);
        this.delay(2000);    
        console.log("Sit");
        this.sit();
        this.delay(5000);
        
    }


    action_cmd () {

        //this.pause = false

        if( this.old !== this.action ){ 
            //this.wantUpdate = true
            this.count = 0
            this.old = this.action
        }

        /*if( this.oldFrame !== this.frame ){ 
            //this.wantUpdate = true
            this.count = 0
            this.oldFrame = this.frame
        }*/

        let step = 1





        
        //char *arg;
        /*arg = SCmd.next();
        action_mode = atoi(arg);
        arg = SCmd.next();
        step = atoi(arg);*/
        const W = this.move

        switch (this.action) {
            case W.FORWARD:
            
            if (!this.is_stand()) this.stand();
            else this.step_forward(step);

            break;
            case W.BACKWARD:
            //console.log("Step back");
            if (!this.is_stand()) this.stand();
            else this.step_back(step);

            break;
            case W.LEFT:
           // console.log("Turn left");
            if (!this.is_stand()) this.stand();
            else this.turn_left(step);
            break;
            case W.RIGHT:
            //console.log("Turn right");
            if (!this.is_stand()) this.stand();
            else this.turn_right(step);
            break;
            case W.SIT:
            this.sit();
            break;
            case W.STAND:
            this.stand();
            break;
            case W.SHAKE:
            //console.log("Hand shake");
            this.hand_shake(step);
            break;
            case W.WAVE:
            //console.log("Hand wave");
            this.hand_wave(step);
            break;
            case W.LEG_INIT:
            //console.log("Legs init");
            this.legs_init();
            break;   
            case W.SONAR:
            //console.log("Sonar mode");
            if (step>0) this.a_dist=step;
            this.do_sonar();
            break;    
            case W.FREEWALK:
           //console.log("Freewalk mode");
            if (step>0) this.a_dist=step;
            this.do_freewalk();
            break;       
            default:
            //console.log("Error");
            break;
        }
    }

    // This gets set as the default handler, and gets called when no other command matches.
    /*unrecognized(const char *command) {
    console.log("What?");
    }*/

    freewalk( dist ) {

        let ping_range;
        ping_range=sonar.ping_cm();
        // turn before 20cm
        if ((ping_range<=dist) && (ping_range!=0)) {
        // turn
        console.log("Turn Left");
        this.turn_left(5);
        } else {
            if (!this.is_stand()) this.stand();
            console.log("Step forward");
            this.step_forward(2);
        }

    }

    /*
    * - freewalk mode
    */
    do_freewalk() {

        if (this.freewalk_mode==false) {
            console.log("FreeWalk ON");
            this.freewalk_mode=true;
        } else {
            console.log("FreeWalk OFF");
            this.freewalk_mode=false;
        }

    }

    /*
    * - sonar mode
    */
    do_sonar(){

        if (this.sonar_mode==false) {
            console.log("Sonar ON");
            this.sonar_mode=true;
        } else {
            console.log("Sonar OFF");
            this.sonar_mode=false;
        }

    }


    /*
    * - legs init
    */

    legs_init(){

        //initialize all servos
        for (let leg = 0; leg < 4; leg++){
            this.set_site(leg, this.keep, 0, 90);
        }
        this.wait_all_reach();
    }


    is_stand(){

        return this.up

        //if (this.site[0][2] == this.z_default) return true;
      /*  if ( this.site[0][2] === this.z_default) return true;
        else return false;*/
    }

    sit(){

        this.countMax = 1
        //console.log("sit");

        for (let leg = 0; leg < 4; leg++){
            this.set_site(leg, this.keep, this.keep, this.z_boot);
        }
        this.up = false
        this.wait_all_reach();
    }

    stand(){

        this.countMax = 1

        //console.log("stand");

        for (let leg = 0; leg < 4; leg++){
            this.set_site(leg, this.keep, this.keep, this.z_default);
        }
        this.up = true
        this.wait_all_reach();

    }

    // spot turn to left

    turn_left( step ){

        this.countMax = 12
        //if (this.site[3][1] == this.y_start){
        switch( this.count ){
            //leg 3&1 move
            case 0: 
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 1: 
                this.set_site(0, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(1, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(2, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(3, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up); 
            break;
            case 2: 
                this.set_site(0, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(1, this.turn_x0 + this.x_offset, this.turn_y0, this.z_default);
                this.set_site(2, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(3, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default); 
            break;
            case 3:  
                this.set_site(1, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
            break;
            case 4:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_default);
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_up);
                this.set_site(2, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(3, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
            break;
            case 5:  
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
            ////
            //leg 0&2 move
            case 6: 
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 7: 
                this.set_site(0, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
                this.set_site(1, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(2, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(3, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
            break;
            case 8: 
                this.set_site(0, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(1, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(2, this.turn_x0 + this.x_offset, this.turn_y0, this.z_default);
                this.set_site(3, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
            break;
            case 9:  
                this.set_site(2, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
            break;
            case 10:  
                this.set_site(0, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(1, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_up);
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
            case 11:  
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
        }

        this.wait_all_reach();
    }

    
    // spot turn to right

    turn_right(step){

        this.countMax = 12
        //if (this.site[2][1] == this.y_start) {
        switch( this.count ){
            //leg 2&0 move
            case 0: 
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 1: 
                this.set_site(0, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(1, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(2, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
                this.set_site(3, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default); 
            break;
            case 2: 
                this.set_site(0, this.turn_x0 + this.x_offset, this.turn_y0, this.z_default);
                this.set_site(1, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(2, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(3, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default); 
            break;
            case 3:  
                this.set_site(0, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
            break;
            case 4:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_up);
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_default);
                this.set_site(2, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(3, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
            break;
            case 5:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
            ////
            //leg 1&3 move
            case 6: 
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 7: 
                this.set_site(0, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(1, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
                this.set_site(2, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(3, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default); 
            break;
            case 8: 
                this.set_site(0, this.turn_x1 - this.x_offset, this.turn_y1, this.z_default);
                this.set_site(1, this.turn_x0 - this.x_offset, this.turn_y0, this.z_default);
                this.set_site(2, this.turn_x1 + this.x_offset, this.turn_y1, this.z_default);
                this.set_site(3, this.turn_x0 + this.x_offset, this.turn_y0, this.z_default);
            break;
            case 9:  
                this.set_site(3, this.turn_x0 + this.x_offset, this.turn_y0, this.z_up);
            break;
            case 10:  
                this.set_site(0, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(1, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_default);
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 11:  
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
        }

        this.wait_all_reach();
    }

    // go forward

    step_forward(){

        this.countMax = 14

        //if ( this.site[2][1] === this.y_start ) {
          //  console.log('2/1move')
            switch( this.count ){
                case 0: 
                    this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_up); 
                    this.isLeft = true
                break;
                case 1: 
                    this.set_site(2, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up); 
                break;
                case 2: 
                    this.set_site(2, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default); 
                break;
                case 3: 
                    this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_default);
                    this.set_site(1, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default);
                    this.set_site(2, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                    this.set_site(3, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default); 
                break;
                case 4:  
                    this.set_site(1, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up);
                break;
                case 5:  
                    this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_up);
                break;
                case 6:  
                    this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_default);
                break;
          /*  }

        } else {
            console.log('0/3move')
            switch( this.count ){*/
                case 7: 
                    this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_up); 
                    this.isLeft = false
                break;
                case 8: 
                    this.set_site(0, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up); 
                break;
                case 9: 
                    this.set_site(0, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default); 
                break;
                case 10: 
                    this.set_site(0, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                    this.set_site(1, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                    this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_default);
                    this.set_site(3, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default); 
                break;
                case 11:  
                    this.set_site(3, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up);
                break;
                case 12:  
                    this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_up);
                break;
                case 13:  
                    this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_default);
                break;
            //}
        }

        this.wait_all_reach();
    }

    // go back

    step_back(step){

        this.countMax = 14
        
        switch( this.count ){
            case 0: 
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 1: 
                this.set_site(3, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up); 
            break;
            case 2: 
                this.set_site(3, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default); 
            break;
            case 3: 
                this.set_site(0, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default);
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_default);
                this.set_site(2, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(3, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default); 
            break;
            case 4:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up);
            break;
            case 5:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 6:  
                this.set_site(0, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;

            ////
        
            case 7: 
                this.set_site(1, this.x_default + this.x_offset, this.y_start, this.z_up); 
            break;
            case 8: 
                this.set_site(1, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up); 
            break;
            case 9: 
                this.set_site(1, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default); 
            break;
            case 10: 
                this.set_site(0, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(1, this.x_default - this.x_offset, this.y_start + this.y_step, this.z_default);
                this.set_site(2, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_default);
                this.set_site(3, this.x_default + this.x_offset, this.y_start, this.z_default); 
            break;
            case 11:  
                this.set_site(2, this.x_default + this.x_offset, this.y_start + 2 * this.y_step, this.z_up);
            break;
            case 12:  
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_up);
            break;
            case 13:  
                this.set_site(2, this.x_default + this.x_offset, this.y_start, this.z_default);
            break;
        }

        this.wait_all_reach();

    }

    // add by RegisHsu

    body_left(i){

        this.set_site(0, this.site[0][0] + i, this.keep, this.keep);
        this.set_site(1, this.site[1][0] + i, this.keep, this.keep);
        this.set_site(2, this.site[2][0] - i, this.keep, this.keep);
        this.set_site(3, this.site[3][0] - i, this.keep, this.keep);
        this.wait_all_reach();

    }

    body_right ( i ) {

        this.set_site(0, this.site[0][0] - i, this.keep, this.keep);
        this.set_site(1, this.site[1][0] - i, this.keep, this.keep);
        this.set_site(2, this.site[2][0] + i, this.keep, this.keep);
        this.set_site(3, this.site[3][0] + i, this.keep, this.keep);
        this.wait_all_reach();
    }

    hand_wave ( i ) {

        this.countMax = 8

        let x_tmp, y_tmp, z_tmp;

        switch( this.count ){
            //if (this.site[3][1] == this.y_start){
            case 0: 
                x_tmp = this.site[2][0];
                y_tmp = this.site[2][1];
                z_tmp = this.site[2][2];
                for (let j = 0; j < i; j++){
                    this.set_site(2, this.turn_x1, this.turn_y1, 50);
                }
            break;
            case 1: 
                for (let j = 0; j < i; j++){
                    this.set_site(2, this.turn_x0, this.turn_y0, 50);
                }
            break;
            case 2: 
                this.set_site(2, x_tmp, y_tmp, z_tmp);
            break;
            case 3: 
                this.body_left(15);
            break;
            ////
            case 4: 
                x_tmp = this.site[2][0];
                y_tmp = this.site[2][1];
                z_tmp = this.site[2][2];
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.turn_x1, this.turn_y1, 50);
                }
            break;
            case 5: 
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.turn_x0, this.turn_y0, 50);
                }
            break;
            case 6: 
                this.set_site(0, x_tmp, y_tmp, z_tmp);
            break;
            case 7: 
                this.body_right(15);
            break;
        }

        this.wait_all_reach();

    }

    hand_shake ( i ) {

        this.countMax = 8

        let x_tmp, y_tmp, z_tmp;

        switch( this.count ){
            //if (this.site[3][1] == this.y_start){
            case 0: 
                x_tmp = this.site[2][0];
                y_tmp = this.site[2][1];
                z_tmp = this.site[2][2];
                for (let j = 0; j < i; j++){
                    this.set_site(2, this.x_default - 30, this.y_start + 2 * this.y_step, 55);
                }
            break;
            case 1: 
                for (let j = 0; j < i; j++){
                    this.set_site(2, this.x_default - 30, this.y_start + 2 * this.y_step, 10);
                }
            break;
            case 2: 
                this.set_site(2, x_tmp, y_tmp, z_tmp)
            break;
            case 3: 
                this.body_left(15);
            break;
            ////
            case 4: 
                x_tmp = this.site[2][0];
                y_tmp = this.site[2][1];
                z_tmp = this.site[2][2];
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.x_default - 30, this.y_start + 2 * this.y_step, 55);
                }
            break;
            case 5: 
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.x_default - 30, this.y_start + 2 * this.y_step, 10);
                }
            break;
            case 6: 
                this.set_site(0, x_tmp, y_tmp, z_tmp);
            break;
            case 7: 
                this.body_right(15);
            break;
        }

        this.wait_all_reach();

    }

    head_up ( i ) {
        this.set_site(0, this.keep, this.keep, this.site[0][2] - i);
        this.set_site(1, this.keep, this.keep, this.site[1][2] + i);
        this.set_site(2, this.keep, this.keep, this.site[2][2] - i);
        this.set_site(3, this.keep, this.keep, this.site[3][2] + i);
        this.wait_all_reach();
    }

    head_down ( i ) {
        this.set_site(0, this.keep, this.keep, this.site[0][2] + i);
        this.set_site(1, this.keep, this.keep, this.site[1][2] - i);
        this.set_site(2, this.keep, this.keep, this.site[2][2] + i);
        this.set_site(3, this.keep, this.keep, this.site[3][2] - i);
        this.wait_all_reach();
    }

    body_dance ( i ){

        this.countMax = 8

        let x_tmp, y_tmp, z_tmp;

        switch( this.count ){
            //if (this.site[3][1] == this.y_start){
            case 0: 
                this.sit();
            break;
            case 1: 
                this.set_site(0, this.x_default, this.y_default, this.keep);
                this.set_site(1, this.x_default, this.y_default, this.keep);
                this.set_site(2, this.x_default, this.y_default, this.keep);
                this.set_site(3, this.x_default, this.y_default, this.keep);
            break;
            case 2: 
                this.set_site(0, this.x_default, this.y_default, this.z_default - 20);
                this.set_site(1, this.x_default, this.y_default, this.z_default - 20);
                this.set_site(2, this.x_default, this.y_default, this.z_default - 20);
                this.set_site(3, this.x_default, this.y_default, this.z_default - 20);
            break;
            case 3: 
                this.head_up(30);
            break;
            ////
            case 4: 
            break;
            case 5: 
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.keep, this.y_default - 20, this.keep);
                    this.set_site(1, this.keep, this.y_default + 20, this.keep);
                    this.set_site(2, this.keep, this.y_default - 20, this.keep);
                    this.set_site(3, this.keep, this.y_default + 20, this.keep);
                }
            break;
            case 6: 
                for (let j = 0; j < i; j++){
                    this.set_site(0, this.keep, this.y_default + 20, this.keep);
                    this.set_site(1, this.keep, this.y_default - 20, this.keep);
                    this.set_site(2, this.keep, this.y_default + 20, this.keep);
                    this.set_site(3, this.keep, this.y_default - 20, this.keep);
                }
            break;
            case 7: 
                this.head_down(30);
            break;
        }

        this.wait_all_reach();

    }



    /*
    - set one of end points' expect site
    - this founction will set temp_speed[4][3] at same time
    - non - blocking function
    ---------------------------------------------------------------------------*/
    set_site( leg, x, y, z ) {

        /*
        let length_x = 0, length_y = 0, length_z = 0;

        if (x != this.keep) length_x = x - this.site[leg][0];
        if (y != this.keep) length_y = y - this.site[leg][1];
        if (z != this.keep) length_z = z - this.site[leg][2];

        //let length = Math.sqrt(Math.pow(length_x, 2) + Math.pow(length_y, 2) + Math.pow(length_z, 2));
        let length = Math.sqrt( length_x*length_x + length_y*length_y + length_z*length_z );

        temp_speed[leg][0] = length_x / length * move_speed * speed_multiple;
        temp_speed[leg][1] = length_y / length * move_speed * speed_multiple;
        temp_speed[leg][2] = length_z / length * move_speed * speed_multiple;
        */

        if (x !== this.keep) this.site[leg][0] = x;
        if (y !== this.keep) this.site[leg][1] = y;
        if (z !== this.keep) this.site[leg][2] = z;

        let r = this.cartesian_to_polar( this.site[leg][0], this.site[leg][1], this.site[leg][2] );
        this.polar_to_servo(leg, r);

    }

    

    
    //  trans site from cartesian to polar
    //  mathematical model 2/2

    cartesian_to_polar( x, y, z ) {

        //calculate w-z degree
        let v, w, pv, pz, pa, pb, a, b, g;
        w = (x >= 0 ? 1 : -1) * (Math.sqrt(x*x + y*y));
        v = w - this.length_c;
        pv = v*v
        pz = z*z
        pa = this.length_a * this.length_a
        pb = this.length_b * this.length_b

        a = Math.atan2(z, v) + Math.acos((pa - pb + pv + pz) / 2 / this.length_a / Math.sqrt(pv + pz));
        b = Math.acos((pa + pb - pv - pz) / 2 / this.length_a / this.length_b);
        //calculate x-y-z degree
        g = (w >= 0) ? Math.atan2(y, x) : Math.atan2(-y, -x);
 
        //return [ alpha, beta, gamma ]
        return [ Math.round( a * this.todeg ), Math.round( b * this.todeg ), Math.round( g * this.todeg ) ]

    }

    polar_to_servo( leg, r ) {

        if( leg === 1 ) leg = 2
        else if( leg === 2 ) leg = 1

        this.servo[leg+4] = r[0]-10 //alpha
        this.servo[leg+8] = r[1]-170// beta;
        this.servo[leg+0] = r[2] //gamma;

    }

}