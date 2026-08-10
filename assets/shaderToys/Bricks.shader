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
    

    // Number of brick rows
    float scale = 8.0;

    vec2 p = uv * scale;

    // Make bricks wider than they are tall
    p.x *= 0.5;

    //-----------------------------------
    // Brick row
    //-----------------------------------

    float row = floor(p.y);

    // Offset every other row
    if(mod(row, 2.0) > 0.5)
    {
        p.x += 0.5;
    }

    //-----------------------------------
    // Brick coordinates
    //-----------------------------------

    vec2 brickID = floor(p);
    vec2 local = fract(p);

    //-----------------------------------
    // Distort edges slightly
    //-----------------------------------

    float edgeNoise = perlinNoise(p * 3.0);

    local += edgeNoise * 0.015;

    //-----------------------------------
    // Mortar
    //-----------------------------------

    float mortarWidth = 0.06;

    float edgeX = min(local.x, 1.0 - local.x);
    float edgeY = min(local.y, 1.0 - local.y);

    float brickMask =
        smoothstep(
            mortarWidth,
            mortarWidth + 0.025,
            min(edgeX, edgeY)
        );

    //-----------------------------------
    // Brick color variation
    //-----------------------------------

    float randomBrick = hash21(brickID);

    vec3 brickDark  = vec3(0.28, 0.055, 0.025);
    vec3 brickBase  = vec3(0.62, 0.16, 0.07);
    vec3 brickLight = vec3(0.78, 0.28, 0.10);

    vec3 brickColor;

    if(randomBrick < 0.35)
    {
        brickColor = brickDark;
    }
    else if(randomBrick > 0.75)
    {
        brickColor = brickLight;
    }
    else
    {
        brickColor = brickBase;
    }

    //-----------------------------------
    // Surface noise
    //-----------------------------------

    float surfaceNoise = fbm(p * 2.5);

    brickColor += surfaceNoise * 0.10;

    //-----------------------------------
    // Small pores / roughness
    //-----------------------------------

    float fineNoise = perlinNoise(p * 20.0);

    brickColor += fineNoise * 0.035;

    //-----------------------------------
    // Mortar color
    //-----------------------------------

    vec3 mortarColor = vec3(0.62, 0.58, 0.50);

    float mortarNoise = fbm(p * 4.0);

    mortarColor += mortarNoise * 0.08;

    //-----------------------------------
    // Combine
    //-----------------------------------

    vec3 color = mix(
        mortarColor,
        brickColor,
        brickMask
    );

    fragColor = vec4(color, 1.0);
}