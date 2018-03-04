
const {log, biglog, errorlog, colorize} = require("./out");
const model = require('./model');

/**
 * Muestra la ayuda
 */
exports.helpCmd = rl => {

    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa");
    rl.prompt();
};
/**
 * Muestra todos los quizzes disponibles
 */
exports.listCmd = rl => {
    model.getAll().forEach((quiz, id) => {

        log(` [${colorize(id, 'magenta')}]: ${quiz.question} `);
    });
    rl.prompt();
};
/**
 * Muestra el quiz indicado
 */
exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    }else {
        try{
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, `magenta`)}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        }catch(error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};
/**
 * Prueba el quiz indicado
 */
exports.testCmd = (rl,id) =>{

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }else{
        try{
            const quiz = model.getByIndex(id);

            rl.question(colorize( quiz.question+'?: ', 'red'), resp =>{

                let solucion = quiz.answer;

                solucion = solucion.replace(/á/gi,"a");
                solucion = solucion.replace(/é/gi,"e");
                solucion = solucion.replace(/í/gi,"i");
                solucion = solucion.replace(/ó/gi,"o");
                solucion = solucion.replace(/ú/gi,"u");

                resp = resp.replace(/á/gi,"a");
                resp = resp.replace(/é/gi,"e");
                resp = resp.replace(/í/gi,"i");
                resp = resp.replace(/ó/gi,"o");
                resp = resp.replace(/ú/gi,"u");

                if(resp.trim().toLowerCase()===solucion.toLowerCase()){

                    log(` Su respuesta es:`);
                    biglog('CORRECTA','green');
                }else{
                    log(` Su respuesta es:`);
                    biglog('INCORRECTA','red');
                };
                rl.prompt();
            });
        }catch (error) {

            errorlog(error.message);
            rl.prompt();
        };
    };
};
/**
 * Añade un quiz a la lista
 */
exports.addCmd = rl =>{

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();

        });
    });

};
/**
 * Borra un quiz de la lista
 */
exports.deleteCmd =(rl,id)  =>{

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    }else {
        try{
            const quiz = model.deleteByIndex(id);

        }catch(error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};
/**
 * Edita el quiz indicado
 */
exports.editCmd = (rl, id) =>{
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};
/**
 * Comienza el juego con los quizzes en orden aleatorio
 */
exports.playCmd = rl =>{

    let score = 0;
    let toBeResolved = [];
    for(var i=0; i<model.count(); i++ ){

        toBeResolved[i]=i;
    }

    const playOne = () => {


        //CASO DE ARRAY VACÍO
        if (toBeResolved.length === 0) {
            log(` No hay nada mas que preguntar.`);
            log(` Fin del examen. Aciertos:`);
            biglog(score, 'green');
            rl.prompt();

        } else {


            const id = Math.floor(Math.random() * toBeResolved.length);


            const quiz = model.getByIndex(toBeResolved[id]);
            toBeResolved.splice(id, 1);


            //ZONA DE RESPUESTAS
            rl.question(colorize( '¿'+ quiz.question+'?: ', 'red'), resp =>{

                let solucion = quiz.answer;

                solucion = solucion.replace(/á/gi,"a");
                solucion = solucion.replace(/é/gi,"e");
                solucion = solucion.replace(/í/gi,"i");
                solucion = solucion.replace(/ó/gi,"o");
                solucion = solucion.replace(/ú/gi,"u");

                resp = resp.replace(/á/gi,"a");
                resp = resp.replace(/é/gi,"e");
                resp = resp.replace(/í/gi,"i");
                resp = resp.replace(/ó/gi,"o");
                resp = resp.replace(/ú/gi,"u");

                if (resp.trim().toLowerCase()===solucion.toLowerCase()) {
                    score++;
                    log(' CORRECTO - Lleva ' + score + ' aciertos.');
                    playOne();

                } else {


                    colorize('Respuesta incorrecta', 'red');
                    log('Su resultado es de :');
                    biglog(score, 'green');


                }
                rl.prompt();


            });

        }

    };

    playOne();
};

/**
 * Muestra los créditos
 */
exports.creditsCmd = rl =>{
    log("Autor de la práctica");
    log("Santiago García Zamora",'green');
    rl.prompt();
};
/**
 * Cierra el juego
 */
exports.quitCmd = rl =>{
    rl.close();

};