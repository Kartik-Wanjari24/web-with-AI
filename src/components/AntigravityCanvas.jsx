import React, { useEffect, useRef } from 'react';

export default function AntigravityCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette for vibrant glowing particles
    const particleColors = [
      'rgba(0, 102, 255, ',   // Vibrant Electric Blue
      'rgba(2, 132, 199, ',   // Sky Blue
      'rgba(56, 189, 248, ',  // Bright Cyan
      'rgba(99, 102, 241, ',  // Indigo
      'rgba(168, 85, 247, ',  // Purple
      'rgba(236, 72, 153, '   // Magenta Accent
    ];

    let particles = [];
    let lastMousePos = { x: -1000, y: -1000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    class MouseParticle {
      constructor(x, y) {
        // Random offset around cursor position
        this.x = x + (Math.random() - 0.5) * 16;
        this.y = y + (Math.random() - 0.5) * 16;
        this.size = Math.random() * 3 + 1.5;

        // Random radial drift velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.6 + 0.4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.colorBase = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.maxLife = Math.random() * 70 + 60; // Lifespan frames (~1.5 to 2.2s at 60fps)
        this.life = this.maxLife;
      }

      draw() {
        const progress = Math.max(0, this.life / this.maxLife);
        // Smooth sine-curve alpha fade in and out
        const alpha = Math.sin(progress * Math.PI) * 0.85;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size * progress), 0, Math.PI * 2);
        ctx.fillStyle = `${this.colorBase}${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${this.colorBase}0.8)`;
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.985; // Air friction
        this.vy *= 0.985;
        this.life -= 1;
      }
    }

    const spawnParticles = (x, y, count = 3) => {
      // Prevent exceeding memory bounds
      if (particles.length >= 250) return;
      for (let i = 0; i < count; i++) {
        particles.push(new MouseParticle(x, y));
      }
    };

    const handleMouseMove = (e) => {
      const currentX = e.clientX;
      const currentY = e.clientY;

      // Distance calculation to spawn proportionally to speed
      const dist = Math.hypot(currentX - lastMousePos.x, currentY - lastMousePos.y);
      const spawnCount = Math.min(6, Math.max(2, Math.floor(dist / 10)));
      spawnParticles(currentX, currentY, spawnCount);

      lastMousePos = { x: currentX, y: currentY };
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        spawnParticles(touch.clientX, touch.clientY, 3);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Connect close particles with subtle glowing lines
    const connectParticles = () => {
      const maxDistance = 85;
      const len = particles.length;

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const lifeFactor = Math.min(
              particles[i].life / particles[i].maxLife,
              particles[j].life / particles[j].maxLife
            );
            const opacity = (1 - dist / maxDistance) * lifeFactor * 0.4;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Continuous Animation Loop
    const animate = () => {
      // Clear canvas every frame
      ctx.clearRect(0, 0, width, height);

      // Only perform drawing calculations if there are active particles
      if (particles.length > 0) {
        connectParticles();

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.update();
          p.draw();

          if (p.life <= 0) {
            particles.splice(i, 1);
          }
        }
      }

      // Always request next frame to keep loop permanently active and ready for mouse movement
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start loop
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-[#050811]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
