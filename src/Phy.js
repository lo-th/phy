//import { MotorOld } from './motor_old/MotorOld.js';


import { MathTool } from './core/MathTool.js';
import { Pool } from './3TH/Pool.js';
import { PhyEngine } from './motor/PhyEngine.js';

export const phy = new PhyEngine();
export const phy2 = PhyEngine;
export const math = MathTool;
export const pool = Pool;