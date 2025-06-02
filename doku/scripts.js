document.addEventListener('DOMContentLoaded', function () {
    // Initialize Mermaid.js for rendering diagrams
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'neutral', // 'default', 'forest', 'dark', 'neutral'
            securityLevel: 'loose', // Consider 'strict' or 'antiscript' based on content
            fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            // Example of theme variables for customization:
            // themeVariables: {
            //     primaryColor: '#007bff',
            //     primaryTextColor: '#fff',
            //     lineColor: '#343a40',
            //     fontSize: '16px'
            // }
        });
        // If diagrams are added dynamically, you might need: mermaid.contentLoaded();
    } else {
        console.warn('Mermaid.js not loaded. Diagrams will not be rendered.');
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } catch (error) {
                console.error('Error scrolling to element:', targetId, error);
            }
        });
    });

    // Highlight active navigation link based on scroll position (optional)
    const sections = document.querySelectorAll('main section');
    const navLi = document.querySelectorAll('nav ul li a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 60) { // 60px offset for sticky nav
                current = section.getAttribute('id');
            }
        });

        navLi.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href').substring(1) === current) {
                a.classList.add('active');
            }
        });
    });

    // Add 'active' class style in styles.css if you use the above scrollspy
    // Example: nav ul li a.active { color: #007bff; font-weight: bold; }

    console.log('Windsurf Gym App documentation scripts loaded and initialized.');
});
