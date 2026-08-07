export async function GET(req) {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      return Response.json({
        error: 'DATABASE_URL não está definida!',
        message: 'A variável de ambiente não foi carregada'
      }, { status: 500 });
    }

    const urlPreview = dbUrl.substring(0, 80) + '...';

    return Response.json({
      message: 'DATABASE_URL está definida e carregada!',
      urlPreview: urlPreview,
      status: 'Conexão pronta'
    }, { status: 200 });
  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
}