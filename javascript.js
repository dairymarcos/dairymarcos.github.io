/* ================================================================
   javascript.js — Funcionalidad de Dairy & Marco
   VERSIÓN CON CARGA DE PRODUCTOS DESDE JSON
   ================================================================ */


/* ----------------------------------------------------------------
   1. SELECCIÓN DE ELEMENTOS DEL HTML
   ---------------------------------------------------------------- */

// Botones de categoría (Dulces, Bebidas, Otros)
var botonesCategoria = document.querySelectorAll('.cat-btn');

// Contenedor donde van los productos
var productGrid = document.getElementById('product-grid');

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
   ---------------------------------------------------------------- */

var categoriaActual = 'dulces';
var tooltipActual = null;
var MAX_UNIDADES = 50;
var todosLosProductos = [];  // Aquí se guardan los productos cargados del JSON


/* ================================================================
   3. CARGAR PRODUCTOS DESDE JSON
   ================================================================ */

function cargarProductos() {
  fetch('productos.json')
    .then(function(respuesta) {
      if (!respuesta.ok) {
        throw new Error('No se pudo cargar productos.json');
      }
      return respuesta.json();
    })
    .then(function(productos) {
      todosLosProductos = productos;
      renderizarProductos(productos);
      inicializarContadores();
      inicializarFiltros();
    })
    .catch(function(error) {
      console.error('Error:', error);
      if (productGrid) {
        productGrid.innerHTML = '<p class="error-message">❌ Error al cargar productos. Verifica que el archivo productos.json existe.</p>';
      }
    });
}


/* ================================================================
   4. RENDERIZAR PRODUCTOS EN LA PÁGINA
   ================================================================ */

function renderizarProductos(productos) {
  if (!productGrid) return;
  
  productGrid.innerHTML = '';
  
  productos.forEach(function(prod, index) {
    var tarjeta = document.createElement('article');
    tarjeta.className = 'product-card';
    tarjeta.setAttribute('data-category', prod.category);
    tarjeta.setAttribute('data-name', prod.name);
    tarjeta.setAttribute('data-price', prod.price);
    tarjeta.setAttribute('data-index', index);
    
    tarjeta.innerHTML = `
      <img src="${prod.image}" alt="${prod.name}" class="product-img" />
      <div class="product-info">
        <h2 class="product-name">${escapeHTML(prod.name)}</h2>
        <p class="product-price">$${prod.price.toFixed(2)}</p>
        <div class="qty-control">
          <button class="qty-btn qty-minus" aria-label="Restar">−</button>
          <span class="qty-value">0</span>
          <button class="qty-btn qty-plus" aria-label="Sumar">+</button>
        </div>
      </div>
    `;
    
    productGrid.appendChild(tarjeta);
  });
}

function escapeHTML(texto) {
  if (!texto) return '';
  return texto.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


/* ================================================================
   5. INICIALIZAR CONTADORES (+/-)
   ================================================================ */

function inicializarContadores() {
  var todasLasTarjetas = document.querySelectorAll('.product-card');
  
  todasLasTarjetas.forEach(function(tarjeta) {
    var botonMenos = tarjeta.querySelector('.qty-minus');
    var botonMas = tarjeta.querySelector('.qty-plus');
    var spanCantidad = tarjeta.querySelector('.qty-value');
    
    // Botón −
    botonMenos.addEventListener('click', function() {
      var cantidadActual = parseInt(spanCantidad.textContent, 10);
      if (cantidadActual > 0) {
        spanCantidad.textContent = cantidadActual - 1;
      }
      actualizarEstadoTarjeta(tarjeta, spanCantidad);
      actualizarBarraFlotante();
    });
    
    // Botón + (con límite de 50)
    botonMas.addEventListener('click', function() {
      var cantidadActual = parseInt(spanCantidad.textContent, 10);
      if (cantidadActual < MAX_UNIDADES) {
        spanCantidad.textContent = cantidadActual + 1;
        actualizarEstadoTarjeta(tarjeta, spanCantidad);
        actualizarBarraFlotante();
      } else {
        alert('⚠️ Máximo ' + MAX_UNIDADES + ' unidades por producto.');
      }
    });
  });
}

function actualizarEstadoTarjeta(tarjeta, spanCantidad) {
  var cantidad = parseInt(spanCantidad.textContent, 10);
  tarjeta.classList.toggle('has-qty', cantidad > 0);
}


/* ================================================================
   6. FILTRO DE CATEGORÍAS
   ================================================================ */

function inicializarFiltros() {
  var todasLasTarjetas = document.querySelectorAll('.product-card');
  
  // Escuchar clics en los botones de categoría
  botonesCategoria.forEach(function(btn) {
    // Remover eventos anteriores para evitar duplicados
    btn.removeEventListener('click', btn.clickHandler);
    
    btn.clickHandler = function() {
      var target = btn.getAttribute('data-target');
      categoriaActual = target;
      
      // Actualizar clases de los botones
      botonesCategoria.forEach(function(b) {
        var esActivo = b.getAttribute('data-target') === target;
        b.classList.toggle('active', esActivo);
        b.setAttribute('aria-selected', esActivo ? 'true' : 'false');
      });
      
      // Filtrar tarjetas
      todasLasTarjetas.forEach(function(tarjeta) {
        var esDeCategoria = tarjeta.getAttribute('data-category') === target;
        tarjeta.classList.toggle('hidden', !esDeCategoria);
      });
    };
    
    btn.addEventListener('click', btn.clickHandler);
  });
}


/* ================================================================
   7. BARRA FLOTANTE DE PEDIDO
   ================================================================ */

function actualizarBarraFlotante() {
  var totalArticulos = 0;
  var totalPrecio = 0;
  var todasLasTarjetas = document.querySelectorAll('.product-card');
  
  todasLasTarjetas.forEach(function(tarjeta) {
    var spanCantidad = tarjeta.querySelector('.qty-value');
    var cantidad = parseInt(spanCantidad.textContent, 10);
    var precio = parseFloat(tarjeta.getAttribute('data-price'));
    
    totalArticulos += cantidad;
    totalPrecio += cantidad * precio;
  });
  
  textoContador.textContent = totalArticulos === 1 ? '1 artículo' : totalArticulos + ' artículos';
  textoTotal.textContent = '$' + totalPrecio.toFixed(2);
  
  if (totalArticulos > 0) {
    barraFlotante.classList.add('visible');
    barraFlotante.setAttribute('aria-hidden', 'false');
  } else {
    barraFlotante.classList.remove('visible');
    barraFlotante.setAttribute('aria-hidden', 'true');
  }
}


/* ================================================================
   8. MODAL — ABRIR Y CERRAR
   ================================================================ */

botonWhatsApp.addEventListener('click', function() {
  fondoModal.classList.add('open');
  fondoModal.setAttribute('aria-hidden', 'false');
  mensajeError.textContent = '';
  campNombre.focus();
});

botonCerrar.addEventListener('click', cerrarModal);

fondoModal.addEventListener('click', function(evento) {
  if (evento.target === fondoModal) {
    cerrarModal();
  }
});

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
   9. TOOLTIP DE AYUDA ❕
   ================================================================ */

function mostrarTooltipAyuda(evento) {
  if (tooltipActual) {
    tooltipActual.remove();
    tooltipActual = null;
  }
  
  tooltipActual = document.createElement('div');
  tooltipActual.className = 'help-tooltip';
  tooltipActual.innerHTML = '📌 <strong>Consejos para tu dirección:</strong><br><br>' +
    '• Incluye: calle, número, reparto y ciudad.<br>' +
    '• Agrega una referencia cercana si puedes.<br>' +
    '• Ejemplo: "Calle 13 #45 e/ 2da y 3ra, Reparto José Martí".<br><br>' +
    '✨ ¡Así recibirás tu pedido sin demoras!';
  
  document.body.appendChild(tooltipActual);
  
  var posicionBoton = botonAyuda.getBoundingClientRect();
  tooltipActual.style.top = (posicionBoton.bottom + 8) + 'px';
  tooltipActual.style.left = (posicionBoton.left - 20) + 'px';
  
  setTimeout(function() {
    if (tooltipActual) tooltipActual.classList.add('show');
  }, 10);
  
  setTimeout(function() {
    ocultarTooltip();
  }, 5000);
}

function ocultarTooltip() {
  if (!tooltipActual) return;
  tooltipActual.classList.remove('show');
  setTimeout(function() {
    if (tooltipActual) {
      tooltipActual.remove();
      tooltipActual = null;
    }
  }, 250);
}

if (botonAyuda) {
  botonAyuda.addEventListener('click', mostrarTooltipAyuda);
}

document.addEventListener('click', function(evento) {
  if (tooltipActual && evento.target !== botonAyuda) {
    ocultarTooltip();
  }
});


/* ================================================================
   10. VALIDACIÓN Y ENVÍO POR WHATSAPP
   ================================================================ */

botonEnviar.addEventListener('click', function() {
  var nombre = campNombre.value.trim();
  var telefono = campTelefono.value.trim();
  var direccion = campDireccion.value.trim();
  var tarjeta = campTarjeta.value.trim();
  
  if (!nombre || !telefono || !direccion || !tarjeta) {
    mensajeError.textContent = '⚠️ Por favor, completa todos los campos.';
    return;
  }
  
  mensajeError.textContent = '';
  
  var lineasProductos = [];
  var totalPrecio = 0;
  var todasLasTarjetas = document.querySelectorAll('.product-card');
  
  todasLasTarjetas.forEach(function(tarjeta) {
    var cantidad = parseInt(tarjeta.querySelector('.qty-value').textContent, 10);
    if (cantidad > 0) {
      var nombreProducto = tarjeta.getAttribute('data-name');
      var precio = parseFloat(tarjeta.getAttribute('data-price'));
      var subtotal = cantidad * precio;
      totalPrecio += subtotal;
      lineasProductos.push('• ' + cantidad + 'x ' + nombreProducto + ' — $' + subtotal.toFixed(2));
    }
  });
  
  var mensaje = '*NUEVO PEDIDO — Dairy & Marco*\n\n' +
  '- Nombre: ' + nombre + '\n' +
  '- Teléfono: ' + telefono + '\n' +
  '- Dirección: ' + direccion + '\n' +
  '- Últimos 4 de tarjeta: ' + tarjeta + '\n\n' +
  '> Productos:\n' +
  '> ' + lineasProductos.join('\n> ') + '\n\n' +
  '*Total: $' + totalPrecio.toFixed(2) + '*';
  
  var numeroWhatsApp = botonWhatsApp.dataset.phone;
  var urlWhatsApp = 'https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(mensaje);
  
  window.open(urlWhatsApp, '_blank');
  cerrarModal();
});


/* ================================================================
   11. INICIALIZACIÓN PRINCIPAL
   ================================================================ */

cargarProductos();
