<?php
// Indicamos que la respuesta será en formato JSON. Es crucial para que el JavaScript funcione.
header('Content-Type: application/json');

// --- CONFIGURACIÓN PRINCIPAL (¡MODIFICAR ESTOS VALORES!) ---

// 1. Pon aquí la dirección de email donde quieres recibir las consultas.
$receiving_email_address = 'tu-email@plagaurbana.com.ar';

// 2. Pon aquí tu "Clave Secreta" de Google reCAPTCHA v3.
$recaptcha_secret_key = 'TU_RECAPTCHA_SECRET_KEY';

// --- FIN DE LA CONFIGURACIÓN ---


// Verificamos que la solicitud sea por el método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Si no es POST, devolvemos un error.
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// --- VALIDACIÓN DE reCAPTCHA v3 (Lógica tomada del script original) ---
$recaptcha_response = $_POST['g-recaptcha-response'];
$user_ip = $_SERVER['REMOTE_ADDR'];

// Si el token de reCAPTCHA no vino, es un error.
if (empty($recaptcha_response)) {
    echo json_encode(['success' => false, 'message' => 'Verificación anti-spam fallida.']);
    exit;
}

$recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify';
$recaptcha_data = [
    'secret'   => $recaptcha_secret_key,
    'response' => $recaptcha_response,
    'remoteip' => $user_ip
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($recaptcha_data)
    ]
];
$context  = stream_context_create($options);
$verify_response = file_get_contents($recaptcha_url, false, $context);
$captcha_success = json_decode($verify_response);

// Si Google dice que la verificación falló o la puntuación es muy baja (posible bot)
if ($captcha_success->success == false || $captcha_success->score < 0.5) {
    echo json_encode(['success' => false, 'message' => 'Error de verificación reCAPTCHA. Pareces un robot.']);
    exit;
}


// --- PROCESAMIENTO DEL FORMULARIO ---
// Recogemos los datos usando los nombres de nuestro HTML y los sanitizamos para seguridad.
$nombre   = htmlspecialchars(trim($_POST['nombre']));
$email    = htmlspecialchars(trim($_POST['email']));
$telefono = htmlspecialchars(trim($_POST['telefono']));
$consulta = htmlspecialchars(trim($_POST['consulta']));

// Validación simple de campos
if (empty($nombre) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($telefono)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, completa todos los campos obligatorios.']);
    exit;
}

// --- COMPOSICIÓN Y ENVÍO DEL EMAIL ---
$asunto = "Nueva consulta desde la web de Plaga Urbana";
$mensaje = "Has recibido una nueva consulta:\n\n";
$mensaje .= "Nombre: $nombre\n";
$mensaje .= "Email: $email\n";
$mensaje .= "Teléfono: $telefono\n\n";
$mensaje .= "Consulta:\n$consulta\n";

// Headers seguros para evitar que el correo sea marcado como SPAM
// ¡Importante! La dirección "From" debería ser una cuenta de correo real en tu dominio.
$headers = "From: Plaga Urbana Web <noreply@plagaurbana.com.ar>\r\n";
$headers .= "Reply-To: $nombre <$email>\r\n"; // Permite responder directamente al cliente.
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Enviamos el correo y verificamos si el envío fue exitoso
if (mail($receiving_email_address, $asunto, $mensaje, $headers)) {
    // Si tuvo éxito, enviamos una respuesta JSON positiva.
    echo json_encode(['success' => true]);
} else {
    // Si falló, enviamos una respuesta JSON negativa.
    echo json_encode(['success' => false, 'message' => 'El servidor no pudo enviar el mensaje. Contacta al administrador.']);
}
?>