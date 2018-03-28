const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

/**
 * Muestra la ayuda
 */
exports.helpCmd = (socket,rl) => {

    log(socket,"Comandos:");
    log(socket,"  h|help - Muestra esta ayuda.");
    log(socket,"  list - Listar los quizzes existentes.");
    log(socket,"  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket,"  add - Añadir un nuevo quiz interactivamente.");
    log(socket,"  delete <id> - Borrar el quiz indicado.");
    log(socket,"  edit <id> - Editar el quiz indicado.");
    log(socket,"  test <id> - Probar el quiz indicado.");
    log(socket,"  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket,"  credits - Créditos.");
    log(socket,"  q|quit - Salir del programa");
    rl.prompt();
};
/**
 * Muestra todos los quizzes disponibles
 */
exports.listCmd = (socket,rl) => {
    models.quiz.findAll()
         .each(quiz => {
        log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
     })
        .catch(error => {
            errorlog(socket, error.message);
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
exports.showCmd = (socket,rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};
/**
 * Prueba el quiz indicado
 */
exports.testCmd = (socket,rl,id) => {


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

                    log(socket,` Su respuesta es correcta.`);
                    biglog(socket,'CORRECTA','green');
                }else{
                    log(socket,` Su respuesta es incorrecta.`);
                    biglog(socket,'INCORRECTA','red');
                };
                rl.prompt();
            });

        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


const makeQuestion = (socket,rl, text)=> {
    return new Sequelize.Promise((resolve, reject)=> {
        rl.question(colorize(text,'red'), answer => {
            resolve(answer.trim());
        });
    });
};
/**
 * Añade un quiz a la lista
 */
exports.addCmd = (socket,rl) => {

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
            log(socket,` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket,`El quiz es erróneo:`);
            error.errors.forEach(({message}) => errorlog(socket,message));
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Borra un quiz de la lista
 */
exports.deleteCmd =(socket,rl,id)  =>{

   validateId(id)
       .then(id => models.quiz.destroy({where: {id}}))
       .catch(error => {
           errorlog(socket,error.message);
       })
       .then(() => {
           rl.prompt();
       });
};

/**
 * Edita el quiz indicado
 */
exports.editCmd = (socket,rl, id) =>{
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
          log(socket,` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize(' => ')} ${quiz.answer}`);
      })
      .catch(Sequelize.ValidationError, error => {
          errorlog(socket, 'El quiz es erróneo:');
          error.errors.forEach(({message}) => errorlog(socket,message));
      })
      .catch(error => {
          errorlog(socket,error.message);
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
exports.playCmd = (socket,rl) => {
    let score = 0;
    let orden = 0;
    let tamaño = 0;
    let toBeResolved = [];

    models.quiz.findAll()
        .each(quiz => {
            toBeResolved [quiz.id-1]=quiz.id;
            orden++;
        })
        .then( playOne = (socket) => {
            let id = Math.floor(Math.random() * toBeResolved.length);

            if(toBeResolved.length===0){
                log(socket,` No hay nada mas que preguntar.`);
                log(socket,` Fin del examen. Aciertos:`);
                biglog(socket,score, 'green');
                biglog(socket,`Fin`);
                rl.prompt();
                return;
            }

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
                                log(socket,' CORRECTO - Lleva ' + score + ' aciertos.');
                                toBeResolved.splice(id,1);
                                playOne();

                            }else{
                                log(socket,'INCORRECTO.');
                                log(socket,'Fin del juego. Aciertos: '+ score);
                                biglog(socket,score, 'green');
                                rl.prompt();
                            }

                        })


                })
                })

};

/**
 * Muestra los créditos
 */
exports.creditsCmd = (socket,rl) =>{
    log(socket,"Autor de la práctica");
    log(socket,"Santiago García Zamora",'green');
    rl.prompt();
};

/**
 * Cierra el juego
 */
exports.quitCmd = (socket,rl) =>{
    rl.close();

    socket.end();
};