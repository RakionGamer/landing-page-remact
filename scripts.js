document.addEventListener("DOMContentLoaded", () => {
    // 1. Intersection Observer para animaciones (reveal)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            } else {
                entry.target.classList.remove("is-visible"); // Quita la clase al subir para que se repita la animación
            }
        });
    }, {
        threshold: 0.1, // Se activa cuando el elemento entra un 10% en pantalla
        rootMargin: "0px"
    });

    // Observamos todos los elementos con las clases de animación
    const animatedElements = document.querySelectorAll('.reveal, .reveal-img');

    animatedElements.forEach((el) => {
        observer.observe(el);
    });

    // 2. Efecto Glassmorphism y Resize en el Header
    const header = document.getElementById("main-header");
    const headerContainer = document.getElementById("header-container");
    const logo = document.getElementById("header-logo");
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    function updateHeaderStyle() {
        const isScrolled = window.scrollY > 50;
        const isMenuOpen = mobileMenu && !mobileMenu.classList.contains("hidden");

        // Si se hizo scroll o el menú está abierto, el header debe ser oscuro y tener blur
        if (isScrolled || isMenuOpen) {
            header.classList.add("bg-black/80", "backdrop-blur-md", "shadow-lg", "border-white/10");
            header.classList.remove("border-transparent");
        } else {
            header.classList.remove("bg-black/80", "backdrop-blur-md", "shadow-lg", "border-white/10");
            header.classList.add("border-transparent");
        }

        // El resize del logo y padding solo depende del scroll
        if (isScrolled) {
            if (headerContainer && logo) {
                headerContainer.classList.replace("py-4", "py-2");
                logo.classList.replace("h-24", "h-14");
                logo.classList.replace("w-24", "w-14");
            }
        } else {
            if (headerContainer && logo) {
                headerContainer.classList.replace("py-2", "py-4");
                logo.classList.replace("h-14", "h-24");
                logo.classList.replace("w-14", "w-24");
            }
        }
    }

    window.addEventListener("scroll", updateHeaderStyle);

    // 2.5 Mobile menu toggle
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
            mobileMenu.classList.toggle("flex");
            updateHeaderStyle(); // Refrescar el color del header si estamos al inicio
        });

        mobileLinks.forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.add("hidden");
                mobileMenu.classList.remove("flex");
                updateHeaderStyle();
            });
        });
    }

    // 3. Slider Antes/Después Interactivo Inteligente
    const baContainer = document.getElementById("ba-container");
    const baSlider = document.getElementById("ba-slider");

    if (baContainer && baSlider) {

        // DATA DE CATEGORÍAS
        const baCategories = [
            { name: 'Electricidad', antes: '/Captura de pantalla 2026-07-07 024654.png', despues: '/Captura de pantalla 2026-07-07 024702.png' },
            { name: 'Reparación de Pared', antes: './antes-despues/antes-pared-1.jpg', despues: './antes-despues/despues-pared-2.jpg' },
            { name: 'Instalación de Lavamanos', antes: './antes-despues/llave-lavamanos-antes-1.jpg', despues: './antes-despues/llave-lavamanos-despues-2.jpg' }
        ];
        let currentCategoryIndex = 0;

        const baImgAntes = document.getElementById("ba-img-antes");
        const baImgDespues = document.getElementById("ba-img-despues");
        const baTabs = document.querySelectorAll(".ba-tab");

        function changeCategory(index) {
            currentCategoryIndex = index;
            const cat = baCategories[index];

            // Efecto suave al cambiar la imagen
            baImgAntes.style.opacity = 0;
            baImgDespues.style.opacity = 0;

            // Esperamos 300ms a que termine la animación de fade-out
            setTimeout(() => {
                let loadedCount = 0;
                const preloadAntes = new Image();
                const preloadDespues = new Image();

                const onImgLoad = () => {
                    loadedCount++;
                    if (loadedCount === 2) {
                        baImgAntes.src = cat.antes;
                        baImgDespues.src = cat.despues;
                        // Un pequeño frame para que el navegador registre el cambio de src antes de subir el opacity
                        requestAnimationFrame(() => {
                            baImgAntes.style.opacity = 1;
                            baImgDespues.style.opacity = 1;
                        });
                    }
                };

                preloadAntes.onload = onImgLoad;
                preloadDespues.onload = onImgLoad;

                preloadAntes.src = cat.antes;
                preloadDespues.src = cat.despues;
            }, 300);

            // Clases para el botón ACTIVO
            const activeClasses = ['scale-110', 'md:scale-125', 'text-remact-red', 'font-bold'];

            // Clases para el texto INACTIVO (Se hace normal y un poco transparente)
            const inactiveClasses = ['scale-100', 'text-gray-400', 'font-medium', 'opacity-60'];

            // Actualizar estilos y animaciones de los botones
            baTabs.forEach((tab, i) => {
                if (i === index) {
                    // Quitar clases inactivas y de hover, poner las activas
                    tab.classList.remove(...inactiveClasses, 'hover:text-remact-red', 'hover:scale-105', 'hover:opacity-100');
                    tab.classList.add(...activeClasses);
                } else {
                    // Quitar clases activas, poner las inactivas y devolver el hover
                    tab.classList.remove(...activeClasses);
                    tab.classList.add(...inactiveClasses, 'hover:text-remact-red', 'hover:scale-105', 'hover:opacity-100');
                }
            });
        }

        // Eventos de los botones para cambio manual
        baTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                changeCategory(index);
                // Reiniciamos el ciclo matemático para empezar en la Pausa Izquierda (0%)
                isManual = false;
                startTime = performance.now();
                sliderPos = 0;
                baContainer.style.setProperty("--position", `0%`);
                baSlider.value = 0;
                lastCycleTime = null; // Evita que salte de categoría por el reinicio brusco
            });
        });

        let sliderPos = 0;
        let isManual = false;
        let resumeTimeout = null;
        let startTime = null;
        let lastCycleTime = null;

        // Animación infinita con pausas en los bordes y ease-in-out
        function autoSlide(timestamp) {
            // Iniciamos el ciclo exactamente en 0 (Pausa Izquierda)
            if (!startTime) startTime = timestamp;

            if (!isManual) {
                const elapsedTime = timestamp - startTime;
                const cycleTime = elapsedTime % 7000;
                let progress = 0;

                // Si el ciclo envuelve naturalmente (de ~6999 a ~0), avanzamos de categoría.
                if (lastCycleTime !== null && lastCycleTime > 6500 && cycleTime < 500) {
                    const nextIndex = (currentCategoryIndex + 1) % baCategories.length;
                    changeCategory(nextIndex);
                }
                lastCycleTime = cycleTime;

                // Nuevo Ciclo Matemático:
                // 0 - 1000: Pausa en el borde izquierdo (0%)
                // 1000 - 3500: Ida hacia la derecha (0% a 100%)
                // 3500 - 4500: Pausa en el borde derecho (100%)
                // 4500 - 7000: Vuelta a la izquierda (100% a 0%)
                if (cycleTime < 1000) {
                    progress = 0;
                } else if (cycleTime < 3500) {
                    const t = (cycleTime - 1000) / 2500;
                    progress = 0.5 - 0.5 * Math.cos(Math.PI * t);
                } else if (cycleTime < 4500) {
                    progress = 1;
                } else {
                    const t = (cycleTime - 4500) / 2500;
                    progress = 0.5 + 0.5 * Math.cos(Math.PI * t);
                }

                sliderPos = progress * 100;

                const visualPos = Math.max(0, Math.min(100, sliderPos));
                baContainer.style.setProperty("--position", `${visualPos}%`);
                baSlider.value = visualPos;
            }
            requestAnimationFrame(autoSlide);
        }

        // Iniciar animación solo cuando sea visible por primera vez
        let started = false;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !started) {
                    started = true;
                    requestAnimationFrame(autoSlide);
                    observer.unobserve(baContainer);
                }
            });
        }, { threshold: 0.3 }); // arranca cuando el 30% del widget es visible

        observer.observe(baContainer);

        // Función cuando el usuario interactúa
        let lastSliderPos = 50;
        const onInteract = (e) => {
            isManual = true;
            lastSliderPos = sliderPos;
            sliderPos = parseFloat(e.target.value);
            baContainer.style.setProperty("--position", `${sliderPos}%`);
            clearTimeout(resumeTimeout);
        };

        // Función cuando el usuario deja de interactuar
        const onRelease = () => {
            clearTimeout(resumeTimeout);
            resumeTimeout = setTimeout(() => {
                // Determinar dirección en la que iba el usuario al arrastrar
                const movingForward = sliderPos >= lastSliderPos;
                const progress = sliderPos / 100;

                let fakeCycleTime = 0;
                // Calculamos el tiempo matemático exacto de la curva para no dar saltos
                if (movingForward) {
                    const t = Math.acos(1 - 2 * progress) / Math.PI;
                    fakeCycleTime = 1000 + (t * 2500);
                } else {
                    const t = Math.acos(2 * progress - 1) / Math.PI;
                    fakeCycleTime = 4500 + (t * 2500);
                }

                // Engañamos al sistema ajustando startTime
                // para que (timestamp actual - startTime) % 7000 == fakeCycleTime
                startTime = performance.now() - fakeCycleTime;
                lastCycleTime = fakeCycleTime; // Previene un salto si justo cae cerca del 0
                isManual = false;
            }, 1000); // Reanuda 1 segundo después de soltar
        };

        // Eventos
        baSlider.addEventListener("input", onInteract);
        baSlider.addEventListener("change", onRelease);
        baSlider.addEventListener("mouseup", onRelease);
        baSlider.addEventListener("touchend", onRelease);
    }

    // 4. Animación Odometer para las estadísticas
    const odometers = document.querySelectorAll('.odometer');
    if (odometers.length > 0) {
        const odometerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const endValue = parseInt(target.getAttribute('data-target'), 10);

                    // Duraciones independientes basadas en la magnitud del número
                    let duration = 2000;
                    if (endValue <= 10) duration = 1500;
                    else if (endValue <= 100) duration = 2200;
                    else duration = 3000;

                    const startTime = performance.now();

                    function updateNumber(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        let progress = elapsedTime / duration;

                        if (progress > 1) progress = 1;

                        // easeOutExpo: arranca rápido y frena suavemente al final
                        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                        const currentValue = Math.floor(endValue * easeProgress);

                        target.textContent = currentValue.toLocaleString('en-US');

                        if (progress < 1) {
                            requestAnimationFrame(updateNumber);
                        } else {
                            target.textContent = endValue.toLocaleString('en-US');
                        }
                    }

                    requestAnimationFrame(updateNumber);
                    observer.unobserve(target); // Solo anima una vez
                }
            });
        }, { threshold: 0.5 });

        odometers.forEach(el => odometerObserver.observe(el));
    }

    // 5. Velocidad de Videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.playbackRate = 1.25;
    });
});

// 6. Filtrado de Proyectos
function filterProjects(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.project-item');

    // Actualizar estilo visual de los botones
    buttons.forEach(btn => {
        if (btn.dataset.filter === category) {
            btn.className = "filter-btn px-6 py-2 rounded-full border border-remact-red bg-remact-red text-white font-bold text-sm transition-all duration-300 active";
        } else {
            btn.className = "filter-btn px-6 py-2 rounded-full border border-gray-600 text-gray-300 hover:border-remact-yellow hover:text-remact-yellow font-bold text-sm transition-all duration-300";
        }
    });

    // Filtrar los elementos
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            // Mostrar elemento
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 10);
        } else {
            // Ocultar elemento
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300); // Esperar a que termine la transición de opacidad
        }
    });
}
