
  var action_compress   = 1, action_decompress = 2, action_progress   = 3

  export class LZMA {

    constructor( lzma_path ) {
   // export class LZMA = function (lzma_path) {
        
            
            this.callback_obj = {}
            
            ///NOTE: Node.js needs something like "./" or "../" at the beginning.
            this.lzma_worker = new Worker(lzma_path || "./lzma_worker-min.js");
        
        this.lzma_worker.onmessage = function onmessage(e) {
            if (e.data.action === action_progress) {
                if (this.callback_obj[e.data.cbn] && typeof this.callback_obj[e.data.cbn].on_progress === "function") {
                    this.callback_obj[e.data.cbn].on_progress(e.data.result);
                }
            } else {
                if (this.callback_obj[e.data.cbn] && typeof this.callback_obj[e.data.cbn].on_finish === "function") {
                    this.callback_obj[e.data.cbn].on_finish(e.data.result, e.data.error);
                    
                    /// Since the (de)compression is complete, the callbacks are no longer needed.
                    delete this.callback_obj[e.data.cbn];
                }
            }
        }.bind(this)
        
        /// Very simple error handling.
        this.lzma_worker.onerror = function(event) {
            var err = new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
            
            for (var cbn in this.callback_obj) {
                this.callback_obj[cbn].on_finish(null, err);
            }
            
            console.error('Uncaught error in lzma_worker', err);
        }.bind(this)
        
    }

    send_to_worker(action, data, mode, on_finish, on_progress) {
        var cbn;
        
        do {
            cbn = Math.floor(Math.random() * (10000000));
        } while(typeof this.callback_obj[cbn] !== "undefined");
        
        this.callback_obj[cbn] = {
            on_finish:   on_finish,
            on_progress: on_progress
        };
        
        this.lzma_worker.postMessage({
            action: action, /// action_compress = 1, action_decompress = 2, action_progress = 3
            cbn:    cbn,    /// callback number
            data:   data,
            mode:   mode
        });
    }

    compress(mixed, mode, on_finish, on_progress) {
        this.send_to_worker(action_compress, mixed, mode, on_finish, on_progress);
    }
    decompress(byte_arr, on_finish, on_progress) {
        this.send_to_worker(action_decompress, byte_arr, false, on_finish, on_progress);
    }
    worker() {
        return this.lzma_worker;
    }
}
