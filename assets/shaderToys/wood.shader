#define PI 3.14159265359
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

    float n00 = dot(gradient(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
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
        value += amplitude * perlinNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

float knotEffect(vec2 p, vec2 center, float radius)
{
    vec2 d = p - center;

    // Make the knot slightly oval
    d.x *= 0.4;

    float dist = length(d);

    // 1 near knot, 0 outside radius
    float influence = 1.0 - smoothstep(0.0, radius, dist);

    // Circular ring pattern
    float rings = sin(dist * 35.0);

    // Small irregularity
    rings += perlinNoise(p * 18.0) * 2.5;

    return rings * influence;
}

float knotWarp(vec2 p, vec2 center, float radius)
{
    vec2 d = p - center;
    d.x *= 0.4;

    float dist = length(d);

    float influence = 1.0 - smoothstep(0.0, radius, dist);

    // Angle around knot
    float angle = atan(d.y, d.x);

    // Bend surrounding grain
    return sin(angle) * influence * 10.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    vec2 p = uv * 5.0;

    // Base wood distortion
    float n = fbm(p * 1.5);

    float grain = p.y * 10.0;
    grain += n * 5.0;

    // -------------------------
    // Knots
    // -------------------------

    vec2 knot1 = vec2(2.0, 2.3);
    vec2 knot2 = vec2(4.3, 1.1);

    grain += knotWarp(p, knot1, 0.9);
    grain += knotWarp(p, knot2, 0.7);

    // Turn grain into repeating wood bands
    float wood = sin(grain);

    wood = wood * 0.5 + 0.5;

    // Add circular knot rings
    float knots = 0.0;

    knots += knotEffect(p, knot1, 0.6);
    knots += knotEffect(p, knot2, 0.7);

    wood += knots * 0.15;

    wood = clamp(wood, 0.0, 1.0);

    vec3 darkWood  = vec3(0.32, 0.035, 0.01);
    vec3 lightWood = vec3(0.72, 0.36, 0.10);

    vec3 color = mix(darkWood, lightWood, wood);

    fragColor = vec4(color, 1.0);
}