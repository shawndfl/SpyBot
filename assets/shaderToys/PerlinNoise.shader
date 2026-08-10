// Hash: returns a pseudo-random 2D direction
float hash21(vec2 p)
{
    return fract(
        sin(dot(p, vec2(127.1, 311.7))) * 43758.5453
    );
}

vec2 gradient(vec2 p)
{
    // Random starting angle
    float start = hash21(p) * 6.28318530718;

    // Different hash for rotation speed
    float speedHash = hash21(p + vec2(19.7, 83.2));

    // Convert 0..1 into -1..1
    float speed = speedHash * 2.0 - 1.0;

    // Slow it down
    speed *= 1.5;

    float angle = start + iTime * speed;

    return vec2(cos(angle), sin(angle));
}

// 2D Perlin-style gradient noise
float perlinNoise(vec2 p)
{
    // Integer grid cell
    vec2 i = floor(p);

    // Position inside grid cell
    vec2 f = fract(p);

    // Smooth interpolation curve
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Gradient vectors at four corners
   
    // Distance vectors from corners
    vec2 d00 = f - vec2(0.0, 0.0);
    vec2 d10 = f - vec2(1.0, 0.0);
    vec2 d01 = f - vec2(0.0, 1.0);
    vec2 d11 = f - vec2(1.0, 1.0);

    vec2 g00 = gradient(i + vec2(0.0, 0.0));
    vec2 g10 = gradient(i + vec2(1.0, 0.0));
    vec2 g01 = gradient(i + vec2(0.0, 1.0));
    vec2 g11 = gradient(i + vec2(1.0, 1.0));

    float n00 = dot(g00, f - vec2(0.0, 0.0));
    float n10 = dot(g10, f - vec2(1.0, 0.0));
    float n01 = dot(g01, f - vec2(0.0, 1.0));
    float n11 = dot(g11, f - vec2(1.0, 1.0));

    float nx0 = mix(n00, n10, u.x);
    float nx1 = mix(n01, n11, u.x);

    return mix(nx0, nx1, u.y);}


float fbm(vec2 p)
{
    float value = 0.0;
    float amplitude = 0.5;

    for(int i = 0; i < 6; i++)
    {
        value += amplitude * perlinNoise(p);

        p *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Correct for screen aspect ratio
    uv.x *= iResolution.x / iResolution.y;

    // Zoom into noise
    vec2 p = uv * 8.0;

    // Slowly move through the noise
    p.x += iTime * 0.4;

    float n = fbm(p);
    
    // Perlin noise is roughly -1 to +1.
    // Convert it to 0 to 1 for displaying as a color.
    n = n * 0.5 + 0.5;

    fragColor = vec4(vec3(n), 1.0);
}