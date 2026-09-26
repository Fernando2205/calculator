# Prompts

This project was built with **Claude Code** (Anthropic) in a single session. Below are the prompts I wrote, in order and verbatim (in Spanish), with a short note on what each one led to. Short confirmations used during the TDD loop are summarized instead of repeated.

## Planning and setup

1. > Hola, necesito resolver una prueba técnica, los detalles están en @sezzle-take-home.md , no quiero que construyas tu a solución, voy a ir escribiendo código y si en algún punto tengo dudas te la preguntaré, el frontend lo podemos dejar para el final, me interesa de momento hacer el backend

   Claude proposed the backend architecture (pure `calculator` package + `api` package), the API design and the edge cases to handle.

2. > me gustaría usar la metologida TDD para trabajar, lo ves adecuado? en cuanto al diseño de la api tendriamos un endpoint por operación y se enviarían los datos en el body

   Decided: TDD, `POST /api/v1/{operation}` with a JSON body, percentage = "a percent of b".

3. > quiero que tu te encargues de hacerme los commits para no perder mucho tiempo, vas a seguir esta guia de buenas prácticas: https://midu.dev/buenas-practicas-escribir-commits-git/

4. > Si, llena el git ignore, ignora el md que es para mi

## Backend (TDD)

5. > windows me está bloqueando la ejecución de los test

   Windows Smart App Control was blocking the Go test binaries.

6. > ya desactivé smart control app, gracias, podemos continuar

7. Short confirmations during each red → green cycle, for example:
   > rojo listo · verde · listo, test verdes · haz los commits · dió error · listo, todo funcionando correctamente · listo, ya lo cambié

## Frontend

8. > La guia de diseño está en la carpeta design_handoff_sezzle_calculator ahí está toda la información necesaria para que tu implementes el frontend

   Claude flagged three mismatches between the handoff and the backend and asked how to resolve them. I chose: keep `/healthz`, keep the backend error codes, and do not commit the handoff folder.

9. > cuando pongo raiz automaticamente me calcula raiz de 0 o del número que está y no quiero eso, quiero poder poner raiz y de ahí el número

   Square root was changed to a prefix operator (tests first).

## Docker and documentation

10. > listo ya validé, podemos continuar, construye el dockerfile

11. > quien te dió el ok a servir todo desde un mismo origen, haciendolo así pierde el sentido haber implementado CORS, usemos docker compose para construir una imagen para el backend y otra para el frontend

    Claude had started a single-image setup without asking. It was reverted and replaced by two services (frontend on nginx, backend) with `docker compose`, keeping separate origins and CORS.

12. > Perfecto, ahora puedes porfavor documentar lo que hicimos, primero yo lo reviso y corrijo en caso de encontrar alguna inconsistencia para que luego hagas el commit
