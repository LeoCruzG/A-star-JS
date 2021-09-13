// Tamaño del mapa
var columnas = 20;
var filas = 20;
// Creación de mapa
var mapa = new Array(filas);
//Creación de las listas
var listaAbierta = [];
var listaCerrada = [];
// Punto de inicio
var inicio;
// Punto de llegada
var fin;
// Tamaño de las casillas
var ancho;
var alto;
// Camino más corto
var camino = [];
// Variable para indicar cuando el final está bloqueado
var sinCamino = false;
// Para medir su gasto
var combustible = 0;
// Aterrizaje exitoso
var aterrizaje = false;
// Botón
let button;
let inputInicioX;
let inputInicioY;
let inputFinalX;
let inputFinalY;
let setInicio;
let setFin;

// Parámetros para el objeto tipo casilla
function Casilla( i, j){
    // Total es el total de la funcion objetivo o f(X) o sea 
    // que es la suma del costo más la distancia
    this.total=0;
    // Costo es el costo acumulado que lleva al visitar esta casilla g(x)
    this.costo=0;
    // Distancia es la distancia entre esta casilla y la meta h(x)
    this.distancia=0;
    // Ubicación de las casillas en el plano de dibujo
    this.x = i; 
    this.y = j;
    // Lista de vecinos adyacentes a esta casilla
    this.vecinos=[];  
    // Referencia a la casilla que se visitó antes que esta
    this.cPrevia = null;
    // Para saber si es un obstáculo
    this.obstaculo = false;
	// Para saber si es una corriente de aire ligera
	this.corriente = false;
    this.costoCorriente = 5;
    // Para saber si es una corriente de aire con lluvia
    this.corrienteFuerte = false;
    this.costoCorrienteFuerte = 10;
	
    // Función para dibujar la casilla en el canvas
    this.pintar = function(color){
        fill(color);
		noStroke();
        if (this.obstaculo) {
            fill(0);
        }
		if (this.corriente){
			fill(130);
        }
        if (this.corrienteFuerte){
			fill(109, 125, 227);
        }
        if (inicio.x == this.x && inicio.y == this.y){
            fill(192, 237, 69);
        }
        if (fin.x == this.x && fin.y == this.y){
            fill(219, 42, 71);
        }
        rect(this.x*ancho,this.y*alto, ancho-1, alto-1);
		//console.log(color);
    }

    // Función para agregar a los vecinos adyacentes
    this.agregarVecinos =  function(mapa){
        // Variables temporales para no escribir "this" a cada rato
        var x = this.x;
        var y = this.y;
        // Evaluación si no están en la orilla y luego su respectiva asignación
        if (i<columnas-1) {
            this.vecinos.push( mapa[i+1] [j]);
        }
        if (i>0) {
            this.vecinos.push( mapa[i-1] [j]);
        }
        if (j<filas-1) {
            this.vecinos.push( mapa[i] [j+1]);
        }
        if (j>0){
            this.vecinos.push( mapa[i] [j-1]);
        }        
    }
    // Agregar obstáculos
    if (random(1) < 0.15) {
        this.obstaculo = true;
    }
	// Agregar corrientes
	if(this.obstaculo == false){
        let r = random(1);
        if(r < 0.05){
            this.corriente =true;
        } else if (r > 0.05 && r<0.1){
            this.corrienteFuerte =true;
        }
        
    }
    // Para detectar si se está haciendo click sobre ella
    this.seraEsta = function(px, py){
        return (px>this.x*ancho && px<((this.x*ancho)+ancho) && py>this.y*alto && py<((this.y*alto)+alto));
    }
    // Para ciclar el estado de las casillas
    this.cambiarEstado = function(){
        if(this.obstaculo && this.corriente == false && this.corrienteFuerte == false){
            this.obstaculo = false;
            this.pintar(255);
            console.log("Casilla: ["+this.x+"]["+this.y+"] es Normal");
        } else
        if(this.obstaculo == false && this.corriente == false && this.corrienteFuerte){
            this.corrienteFuerte = false;
            this.obstaculo = true;
            this.pintar(0);
            console.log("Casilla: ["+this.x+"]["+this.y+"] es Obstaculo");
        } else
        if(this.obstaculo == false && this.corriente && this.corrienteFuerte == false){
            this.corriente = false;
            this.corrienteFuerte = true;
            this.pintar(0);
            console.log("Casilla: ["+this.x+"]["+this.y+"] es CorrienteFuerte");
        } else
        if(this.obstaculo == false && this.corriente == false && this.corrienteFuerte == false){
            this.corriente = true;
            this.pintar(0);
            console.log("Casilla: ["+this.x+"]["+this.y+"] es Corriente");
        }
        
    }
}

// Para quitar un punto de un arreglo
function quitar(arreglo, cosa){
    for (var i = arreglo.length-1; i >=0; i--) {
        if (arreglo[i]==cosa) {
            arreglo.splice(i,1);
        }
    }
}

//Heuristica para guiar a la distancia manhattan para que se vea más natural
function heuristicaVisual(p1, p2){
    return dist(p1.x, p1.y, p2.x, p2.y);
}

// Heurística utilizada (cálculo de distancia)
function heuristica (p1, p2){
    // Distancia euclideana
    //var z = dist(p1.x,p1.y,p2.x,p2.y);
    //Distancia Manhattan
    var z = abs(p1.x-p2.x) + abs(p1.y-p2.y);
    return z;
}

// Para detectar evento de mouse
function mousePressed (){
    for (var i = 0; i < filas; i++) {
        for (var j = 0; j < columnas; j++) {
            if(mapa[i][j].seraEsta(mouseX, mouseY)){
                mapa[i][j].cambiarEstado();
            }           
        }
    }
}

// Para pintar el último camino
function pintaCamino(c){
    noFill();
    stroke(150,200,150);
    strokeWeight(ancho/4);	
    beginShape();
    for (let i = 0; i < c.length; i++) {
        vertex((camino[i].x*ancho)+ancho/2, (camino[i].y*alto)+alto/2);
    }		
    endShape();
}

// Para calcular el combustible gastado después del recorrido
function calculaCombustible(c){
    var contador=0;
    for (let i = 0; i < c.length; i++) {
        contador++;
        if(c[i].corrienteFuerte){
            contador= contador+c[i].costoCorrienteFuerte;
        }else if(c[i].corriente){
            contador= contador+c[i].costoCorriente;
        }
    }
    // Se quita el inicio
    contador --;
    textSize(14);
    fill(255);
    text('Combustible', width-90, 350);
    
    text('usado: '+contador, width-90, 370);
    return contador;
}

// Para reiniciar la búsqueda del camino
function restart(){
    background(0);
    listaAbierta = [];
    listaCerrada = [];
    camino = [];
    sinCamino = false;
    aterrizaje = false;
    for (var i = 0; i < columnas; i++) {
        for (var j = 0; j < filas; j++) {
            mapa[i][j].cPrevia = null;            
        }        
    }
    listaAbierta.push(inicio);
    combustible = columnas * filas;
    loop();
    console.log("Restarted");
}

// Para asignar un nuevo inicio
function nuevoInicio(){
    let previo = inicio;
    inicio = mapa[inputInicioX.value()][inputInicioY.value()];
    inicio.obstaculo = false;
    inicio.corrienteFuerte = false;
    inicio.corriente = false;
    inicio.pintar(0);
    previo.pintar(255);
}

// Para asignar un nuevo final
function nuevoFin(){
    let previo = fin;
    fin = mapa[inputFinalX.value()][inputFinalY.value()];
    fin.obstaculo = false;
    fin.corrienteFuerte = false;
    fin.corriente = false;
    fin.pintar(0);
    previo.pintar(255);
}

// Esta función es para inicializar todas las cosas del programa
function setup(){
    createCanvas(600,500);
    ancho = (width-100) / columnas;
    alto = (height) / filas;

    console.log("Simulador de vuelo A*");
	
    for (var i = 0; i < columnas; i++) {
        mapa[i]= new Array(filas);        
    }
    
    // Para crear las casillas
    for (var i = 0; i < filas; i++) {
        for (var j = 0; j < columnas; j++) {
            mapa[i][j]=new Casilla(i,j);           
        }
    }
    // Se encuentran los vecinos de cada casilla
    for (var i = 0; i < filas; i++) {
        for (var j = 0; j < columnas; j++) {
            mapa[i][j].agregarVecinos(mapa);            
        }
    }
    
    button = createButton('Restart');
    button.position(width - 70, 350);
    button.mousePressed(restart);

    inputInicioX = createInput();
    inputInicioX.position(width-70, 400);
    inputInicioX.size(30);

    inputInicioY = createInput();
    inputInicioY.position(width-35, 400);
    inputInicioY.size(30);

    inputFinalX = createInput();
    inputFinalX.position(width-70, 500);
    inputFinalX.size(30);

    inputFinalY = createInput();
    inputFinalY.position(width-35, 500);
    inputFinalY.size(30);

    setInicio =  createButton('Set Inicio');
    setInicio.position(width - 70, 450);
    setInicio.mousePressed(nuevoInicio);
    
    setFin = createButton('Set Final');
    setFin.position(width - 70, 550);
    setFin.mousePressed(nuevoFin);

	inicio = mapa[0][0];
    inicio.obstaculo = false;
    inicio.corrienteFuerte = false;
    inicio.corriente = false;
    fin = mapa[columnas-1][filas-1]
    fin.obstaculo = false;
    fin.corriente = false;
    fin.corrienteFuerte = false;

    listaAbierta.push(inicio);
	console.log("fin setup");
	console.log(ancho+" ancho ||| "+alto+" alto ");
	console.log(mapa);
    background (0);
    
    combustible = columnas * filas;
	
}

// Esta función dibuja todo continuamente y se ejecuta cada frame
function draw(){
    
    if (listaAbierta.length > 0) {
        // Variable para almacenar cuál va a ser el siguiente nodo a visitar
        var siguiente = 0;
        // Empieza a visitar todos los nodos en la lista abierta para evaluar cuál es la mejor
        for (var i = 0; i < listaAbierta.length; i++) {
            if (listaAbierta[i].total < listaAbierta[siguiente].total) {
                siguiente = i; 
				//console.log("total: " + listaAbierta[siguiente].total + " g " +listaAbierta[siguiente].costo + " distancia " + listaAbierta[siguiente].distancia);
				//console.log("siguiente "+siguiente )
            }     
			// Si hay empates, es decir si hay casillas con el mismo valor total
			// ayuda a explorar lo más cercano
			if (listaAbierta[i].total == listaAbierta[siguiente].total) {
                    // Se busca dar preferencia a nodos más largos ya que en teoría estarían más cerca del destino
                    if (listaAbierta[i].costo > listaAbierta[siguiente].costo) {
                        siguiente = i;
                    }
					// Como se usa la distancia Manhattan, para que el camino cuando se rompen los empates
					// se vea más natural, se usa una heurística "visual" aunque no afecta la distancia 
					// sólo cómo se ve
                    
                    if (listaAbierta[i].costo == listaAbierta[siguiente].costo && listaAbierta[i].heurVisual < listaAbierta[siguiente].heurVisual) {
                        siguiente = i;
                    }
                    
                }
        }
        
        // Ya que nos quedamos con el mejor se asigna a la variable el nodo que sigue
		var actual = listaAbierta[siguiente];
        
        // En caso de que llegue a la casilla objetivo
        if (actual===fin) {
            aterrizaje = true;
            // noLoop es para frenar esta función draw
            noLoop();
            console.log("Fin");
           
        }

        quitar(listaAbierta, actual);
        listaCerrada.push(actual);

        var vecinos = actual.vecinos;

        for (var i = 0; i < vecinos.length; i++) {
            var vecino = vecinos[i];
            if (!listaCerrada.includes(vecino) && !vecino.obstaculo) { // 
                var costoTemporal  = actual.costo + 1;
				if (vecino.corriente){
					costoTemporal += vecino.costoCorriente;
				} else if (vecino.corrienteFuerte) {
                    costoTemporal += vecino.costoCorrienteFuerte;
                }
				var mejorCamino = false;
                if (listaAbierta.includes(vecino)) {
                    if (costoTemporal < vecino.costo) {
                        vecino.costo = costoTemporal;
                        mejorCamino = true;
						//console.log("vecino ya esta en lista abierta");
                    }
					//console.log(costoTemporal+ " vecino x "+vecino.x+" y "+ vecino.y + " costo " + vecino.costo );
                } else {
                    vecino.costo = costoTemporal;
                    mejorCamino = true;
                    listaAbierta.push(vecino);
					// 	console.log("vecino se pone en lista abierta");
                }

                if (mejorCamino == true) {
                    vecino.distancia = heuristica(vecino, fin);
					vecino.heurVisual = heuristicaVisual(vecino, fin);
                    vecino.total = vecino.costo + vecino.distancia;
                    vecino.cPrevia = actual;
                }                
            }
        }
    } else {
        console.log("No hay ningún camino posible");
        textSize(14);
        fill(255);
        text('No existe \nun camino \nal destino', width-90, 350);
        sinCamino = true;
        noLoop();
        return;
    }

    for (var i = 0; i < columnas; i++) {
        for (var j = 0; j < filas; j++) {
            mapa[i][j].pintar(color(255));            
        }        
    }
/*
    for (var i = 0; i < listaCerrada.length; i++) {
        listaCerrada[i].pintar(color(255,100,100));
    }

    for (var i = 0; i < listaAbierta.length; i++) {
        listaAbierta[i].pintar(color(100,255,100));
    }

    */
    camino = [];
    var t = actual;
    camino.push(t);
    while (t.cPrevia) {
        camino.push(t.cPrevia);
        t=t.cPrevia;
    }
    if (aterrizaje){
        //calculaCombustible(camino);
        calculaCombustible(camino);
        pintaCamino(camino);
    }
    
/*
    for (var i = 0; i < camino.length; i++) {
        camino[i].pintar(color(100,100,255));        
    }
	*/
	
}