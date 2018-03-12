const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

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
    models.quiz.findAll()
         .each(quiz => {
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
     })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const validateId = id=> {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>,`));
        } else {
            id = parseInt (id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};

/**
 * Muestra el quiz indicado
 */
exports.showCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};
/**
 * Prueba el quiz indicado
 */
exports.testCmd = (rl,id) => {


    validateId(id)

    .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
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

                    log(` Su respuesta es correcta.`);
                    biglog('CORRECTA','green');
                }else{
                    log(` Su respuesta es incorrecta.`);
                    biglog('INCORRECTA','red');
                };
                rl.prompt();
            });

        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


const makeQuestion = (rl, text)=> {
    return new Sequelize.Promise((resolve, reject)=> {
        rl.question(colorize(text,'red'), answer => {
            resolve(answer.trim());
        });
    });
};
/**
 * Añade un quiz a la lista
 */
exports.addCmd = rl => {

    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta: ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(`El quiz es erróneo:`);
            error.errors.forEach(({message}) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Borra un quiz de la lista
 */
exports.deleteCmd =(rl,id)  =>{

   validateId(id)
       .then(id => models.quiz.destroy({where: {id}}))
       .catch(error => {
           errorlog(error.message);
       })
       .then(() => {
           rl.prompt();
       });
};

/**
 * Edita el quiz indicado
 */
exports.editCmd = (rl, id) =>{
  validateId(id)
      .then(id=> models.quiz.findById(id))
      .then(quiz => {
          if(!quiz) {
              throw new Error(`No existe un quiz asociado al id=${id}.`);
          }
          process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
          return makeQuestion(rl, 'Introduzca la pregunta: ')
              .then(q => {
                  process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                  return makeQuestion(rl, ' Introduzca la respuesta: ')
                      .then(a => {
                          quiz.question = q;
                          quiz.answer = a;
                          return quiz;
                      });
              });
      })
      .then(quiz => {
          return quiz.save();
      })
      .then(quiz => {
          log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize(' => ')} ${quiz.answer}`);
      })
      .catch(Sequelize.ValidationError, error => {
          errorlog( 'El quiz es erróneo:');
          error.errors.forEach(({message}) => errorlog(message));
      })
      .catch(error => {
          errorlog(error.message);
      })
      .then(() => {
          rl.prompt();
      });
};

const numPreguntas = () =>  {

    var tamaño=0;


    const repetir=()=> {

        tamaño=tamaño+1;
        validateId(tamaño)
            .then(id => models.quiz.findById(id))
            .then(quiz => {

                if (quiz) {
                    tamaño=quiz.id;
                    repetir();

                }
                return  parseInt(tamaño);
            })
    }

};

/**
 * Comienza el juego con los quizzes en orden aleatorio
 */
exports.playCmd = rl => {
    let score = 0;
    let orden = 0;
    let tamaño = 0;
    let toBeResolved = [];

    models.quiz.findAll()
        .each(quiz => {
            toBeResolved [quiz.id-1]=quiz.id;
            orden++;
        })
        .then( playOne=() => {
            let id = Math.floor(Math.random() * toBeResolved.length);

            validateId(id)
                .then(id=> models.quiz.findById(toBeResolved[id]))
                .then(quiz =>{

                    return makeQuestion(rl, `${quiz.question} ?`)

                        .then(resp => {
                            let solucion = quiz.answer;

                            solucion = solucion.replace(/á/gi, "a");
                            solucion = solucion.replace(/é/gi, "e");
                            solucion = solucion.replace(/í/gi, "i");
                            solucion = solucion.replace(/ó/gi, "o");
                            solucion = solucion.replace(/ú/gi, "u");

                            resp = resp.replace(/á/gi, "a");
                            resp = resp.replace(/é/gi, "e");
                            resp = resp.replace(/í/gi, "i");
                            resp = resp.replace(/ó/gi, "o");
                            resp = resp.replace(/ú/gi, "u");

                            if (resp.trim().toLowerCase() === solucion.toLowerCase()) {

                                score++;
                                log(' CORRECTO - Lleva ' + score + ' aciertos.');
                                toBeResolved.splice(id,1);

                            if(score<orden){
                                playOne();

                            }else{
                                log(` No hay nada mas que preguntar.`);
                                log(` Fin del examen. Aciertos:`);
                                biglog(score, 'green');
                                biglog(`Fin`);
                                rl.prompt();
                                return quiz;
                            }
                            }else{
                                log('INCORRECTO.');
                                log('Fin del juego. Aciertos: ' + score);
                                biglog(score, 'green');
                                rl.prompt();
                            }

                        })

                        .then(()=> {
                            rl.prompt();
                        })
                })
                })


/**
        .then(()=> {

            var posicion = 0;
            models.quiz.findAll()
                .each(quiz => {


                        let solucion = valoresAleatorios[quiz.id - 1].answer;
                        rl.question(colorize('¿' + valoresAleatorios[quiz.id - 1].question + '?: ', 'red'), resp => {


                            solucion = solucion.replace(/á/gi, "a");
                            solucion = solucion.replace(/é/gi, "e");
                            solucion = solucion.replace(/í/gi, "i");
                            solucion = solucion.replace(/ó/gi, "o");
                            solucion = solucion.replace(/ú/gi, "u");

                            resp = resp.replace(/á/gi, "a");
                            resp = resp.replace(/é/gi, "e");
                            resp = resp.replace(/í/gi, "i");
                            resp = resp.replace(/ó/gi, "o");
                            resp = resp.replace(/ú/gi, "u");

                            if (resp.trim().toLowerCase() === solucion) {

                                score++;
                                log(' CORRECTO - Lleva ' + score + ' aciertos.');
                                playOne();


                            } else {


                                log('INCORRECTO.');
                                log('Fin del juego. Aciertos: ' + score);
                                biglog(score, 'green');
                                rl.prompt();


                            }

                            if (quiz.id === 4) {
                                log(` No hay nada mas que preguntar.`);
                                log(` Fin del examen. Aciertos:`);
                                biglog(score, 'green');
                                biglog(`Fin`);
                                rl.prompt();
                            }


                        })


                        posicion++;

                })
/**
                let solucion = valoresAleatorios[i].answer;

                rl.question(colorize('¿' + valoresAleatorios[i].question + '?: ', 'red'), resp => {



                    solucion = solucion.replace(/á/gi, "a");
                    solucion = solucion.replace(/é/gi, "e");
                    solucion = solucion.replace(/í/gi, "i");
                    solucion = solucion.replace(/ó/gi, "o");
                    solucion = solucion.replace(/ú/gi, "u");

                    resp = resp.replace(/á/gi, "a");
                    resp = resp.replace(/é/gi, "e");
                    resp = resp.replace(/í/gi, "i");
                    resp = resp.replace(/ó/gi, "o");
                    resp = resp.replace(/ú/gi, "u");

                    if (resp.trim().toLowerCase() === solucion.toLowerCase()) {
                        score++;
                        log(' CORRECTO - Lleva ' + score + ' aciertos.');
                        // playOne();


                    } else {


                        log('INCORRECTO.');
                        log('Fin del juego. Aciertos: ' + score);
                        biglog(score, 'green');
                        rl.prompt();


                    }

                    if (i === valoresAleatorios.length - 1) {
                        log(` No hay nada mas que preguntar.`);
                        log(` Fin del examen. Aciertos:`);
                        biglog(score, 'green');
                        biglog(`Fin`);
                        rl.prompt();
                    }


                })



            //rl.prompt();
            })

*/



};


       /**         log(`Paso el playone`)
                //CASO DE ARRAY VACÍO
                if (toBeResolved.length === 0) {
                    log(` No hay nada mas que preguntar.`);
                    log(` Fin del examen. Aciertos:`);
                    biglog(score, 'green');
                    biglog(`Fin`);
                    rl.prompt();

                } else {


                    log(`Paso el else`)
                    const id = Math.floor(Math.random() * toBeResolved.length);


                    const quiz = models.getByIndex(toBeResolved[id]);
                    toBeResolved.splice(id, 1);


                    //ZONA DE RESPUESTAS
                    rl.question(colorize('¿' + quiz.question + '?: ', 'red'), resp => {

                        let solucion = quiz.answer;

                        solucion = solucion.replace(/á/gi, "a");
                        solucion = solucion.replace(/é/gi, "e");
                        solucion = solucion.replace(/í/gi, "i");
                        solucion = solucion.replace(/ó/gi, "o");
                        solucion = solucion.replace(/ú/gi, "u");

                        resp = resp.replace(/á/gi, "a");
                        resp = resp.replace(/é/gi, "e");
                        resp = resp.replace(/í/gi, "i");
                        resp = resp.replace(/ó/gi, "o");
                        resp = resp.replace(/ú/gi, "u");

                        if (resp.trim().toLowerCase() === solucion.toLowerCase()) {
                            score++;
                            log(' CORRECTO - Lleva ' + score + ' aciertos.');
                            playOne();

                        } else {


                            log('INCORRECTO.');
                            log('Fin del juego. Aciertos: ' + score);
                            biglog(score, 'green');


                        }
                        rl.prompt();


                    });

                }




        })

        .catch(error => {
            errorlog(error.message);
        })

}

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