/* ================================================================
   javascript.js — Funcionalidad de Dairy & Marco
   ================================================================
   ESTRUCTURA DE ESTE ARCHIVO:
     1.  Selección de elementos del HTML
     2.  Estado global (datos que cambian mientras se usa la página)
     3.  Filtro de categorías (botones Dulces, Bebidas, Otros)
     4.  Contador de cantidad por producto (+/-)
     5.  Actualización de la barra flotante de pedido
     6.  Apertura y cierre del modal
     7.  Tooltip de ayuda para la dirección
     8.  Validación y envío del pedido por WhatsApp
     9.  Inicialización (mostrar categoría inicial al cargar)
   ================================================================ */


/* ----------------------------------------------------------------
   1. SELECCIÓN DE ELEMENTOS DEL HTML
   Aquí guardamos referencias a los elementos que vamos a usar.
   Si cambias un id en el HTML, también cámbialo aquí.
   ---------------------------------------------------------------- */

// Botones de categoría (Dulces, Bebidas, Otros)
var botonesCategoria = document.querySelectorAll('.cat-btn');

// Todas las tarjetas de producto
var tarjetasProducto = document.querySelectorAll('.product-card');

// Barra flotante de pedido
var barraFlotante   = document.getElementById('order-bar');
var textoContador   = document.getElementById('order-count');
var textoTotal      = document.getElementById('order-total');
var botonWhatsApp   = document.getElementById('whatsapp-btn');

// Modal de datos del cliente
var fondoModal      = document.getElementById('modal-backdrop');
var botonCerrar     = document.getElementById('modal-close');
var botonEnviar     = document.getElementById('modal-send-btn');
var mensajeError    = document.getElementById('modal-error');

// Campos del formulario dentro del modal
var campNombre      = document.getElementById('input-nombre');
var campTelefono    = document.getElementById('input-tel');
var campDireccion   = document.getElementById('input-dir');
var campTarjeta     = document.getElementById('input-tarjeta');

// Botón de ayuda ❕ (tooltip de la dirección)
var botonAyuda      = document.getElementById('help-dir-btn');


/* ----------------------------------------------------------------
   2. ESTADO GLOBAL
   Variables que guardan la información actual de la página.
   No necesitas cambiar esto.
   ---------------------------------------------------------------- */

// Categoría actualmente visible (debe coincidir con un data-target de los botones)
var categoriaActual = 'dulces';

// Referencia al tooltip de ayuda (null si no está visible)
var tooltipActual = null;


/* ================================================================
   3. FILTRO DE CATEGORÍAS
   Al hacer clic en un botón (Dulces, Bebidas, Otros):
     - Se marca como activo
     - Se muestran solo los productos de esa categoría
     - Los demás se ocultan
   ================================================================ */

function activarCategoria(categoriaSeleccionada) {
  categoriaActual = categoriaSeleccionada;

  // Actualizar clases de los botones
  botonesCategoria.forEach(function(btn) {
    var esteEsElActivo = btn.dataset.target === categoriaSeleccionada;
    btn.classList.toggle('active', esteEsElActivo);
    btn.setAttribute('aria-selected', esteEsElActivo ? 'true' : 'false');
  });

  // Mostrar u ocultar tarjetas según su categoría
  tarjetasProducto.forEach(function(tarjeta) {
    var esDeLaCategoria = tarjeta.dataset.category === categoriaSeleccionada;
    tarjeta.classList.toggle('hidden', !esDeLaCategoria);
  });
}

// Escuchar clics en los botones de categoría
botonesCategoria.forEach(function(btn) {
  btn.addEventListener('click', function() {
    activarCategoria(btn.dataset.target);
  });
});


/* ================================================================
   4. CONTADOR DE CANTIDAD (+/-)
   Cada tarjeta tiene botones + y − para cambiar la cantidad.
   Al cambiar la cantidad:
     - Se actualiza el número visible en la tarjeta
     - Se aplica o quita el borde dorado de "seleccionado"
     - Se recalcula el total en la barra flotante
   ================================================================ */

// Recorre todas las tarjetas y agrega los eventos a sus botones
tarjetasProducto.forEach(function(tarjeta) {

  var botonMenos  = tarjeta.querySelector('.qty-minus');
  var botonMas    = tarjeta.querySelector('.qty-plus');
  var spanCantidad = tarjeta.querySelector('.qty-value');

  // Botón − : resta 1 (mínimo 0)
  botonMenos.addEventListener('click', function() {
    var cantidadActual = parseInt(spanCantidad.textContent, 10);
    if (cantidadActual > 0) {
      spanCantidad.textContent = cantidadActual - 1;
    }
    actualizarEstadoTarjeta(tarjeta, spanCantidad);
    actualizarBarraFlotante();
  });

  // Botón + : suma 1
  botonMas.addEventListener('click', function() {
    var cantidadActual = parseInt(spanCantidad.textContent, 10);
    spanCantidad.textContent = cantidadActual + 1;
    actualizarEstadoTarjeta(tarjeta, spanCantidad);
    actualizarBarraFlotante();
  });
});

// Agrega o quita la clase "has-qty" (borde dorado) según si hay cantidad > 0
function actualizarEstadoTarjeta(tarjeta, spanCantidad) {
  var cantidad = parseInt(spanCantidad.textContent, 10);
  tarjeta.classList.toggle('has-qty', cantidad > 0);
}


/* ================================================================
   5. BARRA FLOTANTE DE PEDIDO
   Calcula el total de todos los productos seleccionados
   y muestra u oculta la barra según si hay artículos.
   ================================================================ */

function actualizarBarraFlotante() {
  var totalArticulos = 0;
  var totalPrecio    = 0;

  // Recorre todas las tarjetas y suma cantidades y precios
  tarjetasProducto.forEach(function(tarjeta) {
    var spanCantidad = tarjeta.querySelector('.qty-value');
    var cantidad     = parseInt(spanCantidad.textContent, 10);
    var precio       = parseFloat(tarjeta.dataset.price);  // viene de data-price en el HTML

    totalArticulos += cantidad;
    totalPrecio    += cantidad * precio;
  });

  // Actualizar textos en la barra
  textoContador.textContent = totalArticulos === 1
    ? '1 artículo'
    : totalArticulos + ' artículos';

  textoTotal.textContent = '$' + totalPrecio.toFixed(2);

  // Mostrar u ocultar la barra flotante
  if (totalArticulos > 0) {
    barraFlotante.classList.add('visible');
    barraFlotante.setAttribute('aria-hidden', 'false');
  } else {
    barraFlotante.classList.remove('visible');
    barraFlotante.setAttribute('aria-hidden', 'true');
  }
}


/* ================================================================
   6. MODAL — ABRIR Y CERRAR
   El modal se abre al presionar "Enviar pedido" y
   se cierra con el botón X o haciendo clic fuera del modal.
   ================================================================ */

// Abrir modal al presionar el botón de WhatsApp en la barra flotante
botonWhatsApp.addEventListener('click', function() {
  fondoModal.classList.add('open');
  fondoModal.setAttribute('aria-hidden', 'false');
  mensajeError.textContent = '';  // limpiar error anterior
  campNombre.focus();             // poner el cursor en el primer campo
});

// Cerrar modal con el botón X
botonCerrar.addEventListener('click', cerrarModal);

// Cerrar modal al hacer clic en el fondo oscuro (fuera de la caja)
fondoModal.addEventListener('click', function(evento) {
  // Solo cerrar si el clic fue directamente en el fondo, no en la caja del modal
  if (evento.target === fondoModal) {
    cerrarModal();
  }
});

// Cerrar modal con la tecla Escape
document.addEventListener('keydown', function(evento) {
  if (evento.key === 'Escape' && fondoModal.classList.contains('open')) {
    cerrarModal();
  }
});

function cerrarModal() {
  fondoModal.classList.remove('open');
  fondoModal.setAttribute('aria-hidden', 'true');
}


/* ================================================================
   7. TOOLTIP DE AYUDA ❕ (campo de dirección)
   Al hacer clic en ❕ aparece una burbuja con consejos.
   Desaparece automáticamente después de 5 segundos
   o al hacer clic fuera de ella.
   ================================================================ */

function mostrarTooltipAyuda(evento) {
  // Si ya hay un tooltip visible, eliminarlo primero
  if (tooltipActual) {
    tooltipActual.remove();
    tooltipActual = null;
  }

  // Crear el elemento del tooltip
  tooltipActual = document.createElement('div');
  tooltipActual.className = 'help-tooltip';

  // CAMBIAR: puedes modificar el texto de los consejos aquí
  tooltipActual.innerHTML =
    '📌 <strong>Consejos para tu dirección:</strong><br><br>' +
    '• Incluye: calle, número, reparto y ciudad.<br>' +
    '• Agrega una referencia cercana si puedes.<br>' +
    '• Ejemplo: "Calle 13 #45 e/ 2da y 3ra, Reparto José Martí".<br><br>' +
    '✨ ¡Así recibirás tu pedido sin demoras!';

  document.body.appendChild(tooltipActual);

  // Posicionar el tooltip debajo del botón ❕
  var posicionBoton = botonAyuda.getBoundingClientRect();
  tooltipActual.style.top  = (posicionBoton.bottom + 8) + 'px';
  tooltipActual.style.left = (posicionBoton.left - 20) + 'px';

  // Mostrar con animación (pequeño retraso para que la transición funcione)
  setTimeout(function() {
    if (tooltipActual) {
      tooltipActual.classList.add('show');
    }
  }, 10);

  // Ocultar automáticamente después de 5 segundos
  setTimeout(function() {
    ocultarTooltip();
  }, 5000);
}

function ocultarTooltip() {
  if (!tooltipActual) return;
  tooltipActual.classList.remove('show');
  // Eliminar del DOM después de que termine la transición
  setTimeout(function() {
    if (tooltipActual) {
      tooltipActual.remove();
      tooltipActual = null;
    }
  }, 250);
}

// Mostrar tooltip al hacer clic en ❕
if (botonAyuda) {
  botonAyuda.addEventListener('click', mostrarTooltipAyuda);
}

// Ocultar tooltip al hacer clic en cualquier otro lugar
document.addEventListener('click', function(evento) {
  if (tooltipActual && evento.target !== botonAyuda) {
    ocultarTooltip();
  }
});


/* ================================================================
   8. VALIDACIÓN Y ENVÍO DEL PEDIDO POR WHATSAPP
   Al presionar "Enviar pedido por WhatsApp":
     1. Valida que los campos obligatorios estén llenos
     2. Construye un resumen de los productos seleccionados
     3. Arma el mensaje con todos los datos
     4. Abre WhatsApp con ese mensaje listo para enviar
   ================================================================ */

botonEnviar.addEventListener('click', function() {

  // ── VALIDACIÓN DE CAMPOS OBLIGATORIOS ──────────────────────────
  // Para hacer un campo NO obligatorio: elimina su línea de aquí.
  // Para agregar uno nuevo: copia una línea y cambia la variable.
  var nombre    = campNombre.textContent    || campNombre.value.trim();
  var telefono  = campTelefono.textContent  || campTelefono.value.trim();
  var direccion = campDireccion.textContent || campDireccion.value.trim();
  var tarjeta   = campTarjeta.textContent   || campTarjeta.value.trim();

  // Leer valores de los inputs
  nombre    = campNombre.value.trim();
  telefono  = campTelefono.value.trim();
  direccion = campDireccion.value.trim();
  tarjeta   = campTarjeta.value.trim();

  // Verificar que ningún campo obligatorio esté vacío
  if (!nombre || !telefono || !direccion || !tarjeta) {
    // CAMBIAR: puedes personalizar este mensaje de error
    mensajeError.textContent = '⚠️ Por favor, completa todos los campos.';
    return;  // detener el envío si falta algo
  }

  mensajeError.textContent = ''; // limpiar error si todo está bien

  // ── CONSTRUCCIÓN DEL RESUMEN DE PRODUCTOS ──────────────────────
  var lineasProductos = [];
  var totalPrecio     = 0;

  tarjetasProducto.forEach(function(tarjeta) {
    var cantidad = parseInt(tarjeta.querySelector('.qty-value').textContent, 10);
    if (cantidad > 0) {
      var nombreProducto = tarjeta.dataset.name;
      var precio         = parseFloat(tarjeta.dataset.price);
      var subtotal       = cantidad * precio;
      totalPrecio       += subtotal;

      // Formato: "• 2x Maní Molido — $240.00"
      lineasProductos.push(
        '• ' + cantidad + 'x ' + nombreProducto + ' — $' + subtotal.toFixed(2)
      );
    }
  });

  // ── ARMADO DEL MENSAJE ─────────────────────────────────────────
  // CAMBIAR: puedes modificar el formato del mensaje que se envía por WhatsApp
  var mensaje =
    '🛒 *NUEVO PEDIDO — Dairy & Marco*\n\n' +

    '👤 *Nombre:* ' + nombre + '\n' +
    '📞 *Teléfono:* ' + telefono + '\n' +
    '📍 *Dirección:* ' + direccion + '\n' +
    '💳 *Últimos 4 de tarjeta:* ' + tarjeta + '\n\n' +

    '📦 *Productos:*\n' +
    lineasProductos.join('\n') + '\n\n' +

    '💰 *Total: $' + totalPrecio.toFixed(2) + '*';

  // ── ABRIR WHATSAPP ─────────────────────────────────────────────
  // El número viene del atributo data-phone del botón en el HTML
  var numeroWhatsApp = botonWhatsApp.dataset.phone;
  var mensajeCodificado = encodeURIComponent(mensaje);
  var urlWhatsApp = 'https://wa.me/' + numeroWhatsApp + '?text=' + mensajeCodificado;

  window.open(urlWhatsApp, '_blank');  // abre WhatsApp en una nueva pestaña
  cerrarModal();
});


/* ================================================================
   9. INICIALIZACIÓN
   Se ejecuta al cargar la página.
   Muestra la primera categoría (dulces por defecto).
   ================================================================ */

// CAMBIAR: si quieres que se muestre otra categoría al cargar,
// cambia 'dulces' por el nombre de la categoría deseada
activarCategoria('dulces');
