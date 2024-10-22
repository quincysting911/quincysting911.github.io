document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const heroSection = document.querySelector('#hero');
        const scrollPosition = window.pageYOffset;
        heroSection.style.backgroundPositionY = `${scrollPosition * 0.7}px`;
    });

    // Form submission handling
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Simulate sending an email (in a real scenario, this would be handled by a server)
        console.log(`Sending email to: qinyan_mcse@hotmail.com`);
        console.log(`From: ${name} (${email})`);
        console.log(`Message: ${message}`);

        alert(`Thank you for your message, ${name}! Your query will be sent to qinyan_mcse@hotmail.com. We will get back to you soon.`);
        contactForm.reset();
    });
});