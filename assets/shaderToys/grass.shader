#define TAU 6.28318530718

float hash21(vec2 p)
{
    return fract(
        sin(dot(p, vec2(127.1, 311.7))) * 43758.5453
    );
}

vec2 gradient(vec2 p)
{
    float angle = hash21(p) * TAU;
    return vec2(cos(angle), sin(angle));
}

float perlinNoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float n00 = dot(gradient(i + vec2(0.0, 0.0)), f);
    float n10 = dot(gradient(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float n01 = dot(gradient(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float n11 = dot(gradient(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    float nx0 = mix(n00, n10, u.x);
    float nx1 = mix(n01, n11, u.x);

    return mix(nx0, nx1, u.y);
}

float fbm(vec2 p)
{
    float value = 0.0;
    float amplitude = 0.5;

    for(int i = 0; i < 5; i++)
    {
        value += perlinNoise(p) * amplitude;
        p *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    vec2 p = uv * 5.0;

    //----------------------------------
    // Large grassy patches
    //----------------------------------

    float largeNoise = fbm(p * 0.8);

    //----------------------------------
    // Medium variation
    //----------------------------------

    float mediumNoise = fbm(p * 3.0);

    //----------------------------------
    // Fine grass texture
    //----------------------------------

    float fineNoise = perlinNoise(p * 25.0);

    //----------------------------------
    // Blade-like vertical streaks
    //----------------------------------

    float blades = perlinNoise(
        vec2(
            p.x * 30.0,
            p.y * 5.0
        )
    );

    //----------------------------------
    // Grass colors
    //----------------------------------

    vec3 darkGrass  = vec3(0.045, 0.16, 0.025);
    vec3 grass      = vec3(0.10, 0.32, 0.045);
    vec3 lightGrass = vec3(0.24, 0.48, 0.08);

    //----------------------------------
    // Base grass
    //----------------------------------

    float grassValue = 0.5;

    grassValue += largeNoise * 0.45;
    grassValue += mediumNoise * 0.20;
    grassValue += fineNoise * 0.08;

    grassValue = clamp(grassValue, 0.0, 1.0);

    vec3 color = mix(
        darkGrass,
        lightGrass,
        grassValue
    );

    //----------------------------------
    // Add blade streaks
    //----------------------------------

    color += blades * 0.04;

    fragColor = vec4(color, 1.0);
}