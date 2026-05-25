import os
import secrets
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, abort
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Segurança: chave secreta da variável de ambiente ou gerada
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Base de dados: caminho absoluto
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'database', 'tarefas.db')
os.makedirs(os.path.dirname(db_path), exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ------------------------------------------------------------
# Modelos
# ------------------------------------------------------------
class Grupo(db.Model):
    __tablename__ = "grupos"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(50), nullable=True)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    contador_tarefas = db.Column(db.Integer, default=0)
    categorias = db.relationship('Categoria', back_populates='grupo', lazy=True, cascade="all, delete-orphan")
    membros = db.relationship('Membro', backref='grupo', lazy=True, cascade="all, delete-orphan")

class Comentario(db.Model):
    __tablename__ = "comentarios"
    id = db.Column(db.Integer, primary_key=True)
    texto = db.Column(db.String(500), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    tarefa_id = db.Column(db.Integer, db.ForeignKey('tarefas.id'), nullable=False)
    tarefa = db.relationship('Tarefa', backref='comentarios')
    membro_id = db.Column(db.Integer, db.ForeignKey('membros.id'), nullable=True)
    membro_nome = db.Column(db.String(80), nullable=False)  # guarda o nome mesmo se o membro for removido


class Membro(db.Model):
    __tablename__ = "membros"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(80), nullable=False)
    senha_hash = db.Column(db.String(200), nullable=False)
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos.id'), nullable=False)
    is_gerente = db.Column(db.Boolean, default=False)

    def set_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def check_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)


class Categoria(db.Model):
    __tablename__ = "categorias"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)
    cor = db.Column(db.String(20), default="#ff6b6b")
    icone = db.Column(db.String(50), default="infraestrutura")
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos.id'), nullable=False)
    grupo = db.relationship('Grupo', back_populates='categorias')
    tarefas = db.relationship('Tarefa', back_populates='categoria', lazy=True,
                              cascade="all, delete-orphan")


class Tarefa(db.Model):
    __tablename__ = "tarefas"
    id = db.Column(db.Integer, primary_key=True)
    conteudo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.String(500), nullable=True)
    profissionais = db.Column(db.String(200), nullable=True)
    feita = db.Column(db.Boolean, default=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    data_limite = db.Column(db.DateTime, nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    categoria = db.relationship('Categoria', back_populates='tarefas')
    prioridade = db.Column(db.String(20), default="Media")
    status = db.Column(db.String(20), default="Aberto")
    numero_os = db.Column(db.Integer, nullable=True)

    @staticmethod
    def validate(conteudo, categoria_id):
        if not conteudo or not conteudo.strip():
            return "O título é obrigatório."
        if not categoria_id:
            return "A categoria é obrigatória."
        if len(conteudo) > 200:
            return "O título não pode exceder 200 caracteres."
        return None


# ------------------------------------------------------------
# CSRF token (proteção)
# ------------------------------------------------------------
@app.before_request
def csrf_protect():
    if request.method in ('POST', 'PUT', 'DELETE'):
        token = session.get('_csrf_token')
        if not token or request.headers.get('X-CSRFToken') != token:
            return jsonify({'success': False, 'error': 'Token CSRF inválido'}), 400


@app.context_processor
def inject_csrf_token():
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_hex(32)
    return {'csrf_token': session['_csrf_token']}


# ------------------------------------------------------------
# Página inicial – lista de grupos
# ------------------------------------------------------------
@app.route('/')
def home():
    grupos = Grupo.query.order_by(Grupo.nome).all()
    return render_template('grupos.html', grupos=grupos)


@app.route('/criar-grupo', methods=['POST'])
def criar_grupo():
    data = request.get_json()
    nome = data.get('nome', '').strip()
    slug = data.get('slug', '').strip().lower()
    codigo = data.get('codigo', '').strip() or None
    admin_nome = data.get('admin_nome', '').strip()
    admin_senha = data.get('admin_senha', '').strip()

    if not nome or not slug:
        return jsonify({'success': False, 'error': 'Nome e slug obrigatórios'}), 400
    if Grupo.query.filter_by(slug=slug).first():
        return jsonify({'success': False, 'error': 'Este slug já existe'}), 400

    grupo = Grupo(nome=nome, slug=slug, codigo=codigo)
    db.session.add(grupo)
    db.session.flush()

    if admin_nome and admin_senha:
        membro = Membro(nome=admin_nome, grupo_id=grupo.id, is_gerente=True)
        membro.set_senha(admin_senha)
        db.session.add(membro)

    db.session.commit()
    return jsonify({'success': True, 'slug': grupo.slug}), 201


@app.route('/eliminar-grupo/<slug>', methods=['DELETE'])
def eliminar_grupo(slug):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    db.session.delete(grupo)
    db.session.commit()
    return jsonify({'success': True})


# ------------------------------------------------------------
# Página do grupo (onde tudo acontece)
# ------------------------------------------------------------
@app.route('/grupo/<slug>')
def grupo(slug):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    categorias = Categoria.query.filter_by(grupo_id=grupo.id).order_by(Categoria.nome).all()
    tarefas = Tarefa.query.filter(Tarefa.categoria.has(grupo_id=grupo.id)).order_by(Tarefa.data_criacao.desc()).all()

    categorias_json = [{
        'id': c.id, 'nome': c.nome, 'cor': c.cor, 'icone': c.icone,
        'data_criacao': c.data_criacao.isoformat() if c.data_criacao else None
    } for c in categorias]

    tarefas_por_categoria = {}
    tarefas_sem_categoria = []
    for t in tarefas:
        td = {
            'id': t.id, 'conteudo': t.conteudo, 'descricao': t.descricao or '',
            'profissionais': t.profissionais or '', 'feita': t.feita,
            'data_criacao': t.data_criacao.isoformat() if t.data_criacao else None,
            'data_limite': t.data_limite.isoformat() if t.data_limite else None,
            'categoria_id': t.categoria_id, 'prioridade': t.prioridade, 'status': t.status
        }
        if t.categoria_id:
            tarefas_por_categoria.setdefault(t.categoria_id, []).append(td)
        else:
            tarefas_sem_categoria.append(td)

    membro_id = session.get(f'membro_{slug}')
    membro_nome = session.get(f'membro_nome_{slug}')
    membro_is_gerente = False
    if membro_id:
        membro = Membro.query.get(membro_id)
        if membro and membro.is_gerente:
            membro_is_gerente = True

    return render_template('grupo.html',
                           grupo=grupo,
                           categorias=categorias_json,
                           tarefas_por_categoria=tarefas_por_categoria,
                           tarefas_sem_categoria=tarefas_sem_categoria,
                           codigo_correto=grupo.codigo,
                           membro_logado=membro_id is not None,
                           membro_nome=membro_nome or '',
                           membro_is_gerente=membro_is_gerente)


# ------------------------------------------------------------
# Autenticação de membros
# ------------------------------------------------------------
@app.route('/grupo/<slug>/login', methods=['POST'])
def grupo_login(slug):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    data = request.get_json()
    membro_id = data.get('membro_id')
    senha = data.get('senha', '')
    membro = Membro.query.filter_by(id=membro_id, grupo_id=grupo.id).first()
    if membro and membro.check_senha(senha):
        session[f'membro_{slug}'] = membro.id
        session[f'membro_nome_{slug}'] = membro.nome
        session[f'membro_is_gerente_{slug}'] = membro.is_gerente
        return jsonify({'success': True, 'nome': membro.nome})
    return jsonify({'success': False, 'error': 'Credenciais inválidas'}), 401


@app.route('/grupo/<slug>/logout', methods=['POST'])
def grupo_logout(slug):
    session.pop(f'membro_{slug}', None)
    session.pop(f'membro_nome_{slug}', None)
    session.pop(f'membro_is_gerente_{slug}', None)
    return jsonify({'success': True})


# ------------------------------------------------------------
# Proteção de gerente (decorador)
# ------------------------------------------------------------
def gerente_required(slug):
    membro_id = session.get(f'membro_{slug}')
    if not membro_id:
        abort(401)
    membro = Membro.query.get(membro_id)
    if not membro or not membro.is_gerente or membro.grupo.slug != slug:
        abort(403)
    return membro


# ------------------------------------------------------------
# Rotas de membros
# ------------------------------------------------------------
@app.route('/grupo/<slug>/membros', methods=['GET'])
def listar_membros(slug):
    """Rota pública: retorna id e nome dos membros para o modal de login."""
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    membros = Membro.query.filter_by(grupo_id=grupo.id).all()
    return jsonify([{
        'id': m.id,
        'nome': m.nome
    } for m in membros])


@app.route('/grupo/<slug>/membros', methods=['POST'])
def criar_membro(slug):
    gerente_required(slug)
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    data = request.get_json()
    nome = data.get('nome', '').strip()
    senha = data.get('senha', '').strip()
    if not nome or not senha:
        return jsonify({'success': False, 'error': 'Nome e senha obrigatórios'}), 400
    if Membro.query.filter_by(nome=nome, grupo_id=grupo.id).first():
        return jsonify({'success': False, 'error': 'Já existe um membro com este nome'}), 400
    membro = Membro(nome=nome, grupo_id=grupo.id, is_gerente=data.get('is_gerente', False))
    membro.set_senha(senha)
    db.session.add(membro)
    db.session.commit()
    return jsonify({'success': True, 'id': membro.id}), 201


@app.route('/grupo/<slug>/membros/<int:id>', methods=['DELETE'])
def remover_membro(slug, id):
    gerente_required(slug)
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    membro = Membro.query.filter_by(id=id, grupo_id=grupo.id).first_or_404()
    db.session.delete(membro)
    db.session.commit()
    return jsonify({'success': True})


# ------------------------------------------------------------
# Rotas de tarefas dentro do grupo
# ------------------------------------------------------------
@app.route('/grupo/<slug>/criar-tarefa', methods=['POST'])
def criar_tarefa_grupo(slug):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    conteudo = request.form.get('conteudo_tarefa', '').strip()
    categoria_id = request.form.get('categoria_id')
    erro = Tarefa.validate(conteudo, categoria_id)
    if erro:
        return jsonify({'success': False, 'error': erro}), 400

    # Gerar número de OS sequencial para este grupo
    # Bloquear o grupo para evitar concorrência (SQLite não suporta SELECT ... FOR UPDATE,
    # mas podemos usar um lock otimista com session.begin_nested)
    try:
        db.session.refresh(grupo)  # garante que temos a versão mais recente
        grupo.contador_tarefas += 1
        novo_numero = grupo.contador_tarefas

        tarefa = Tarefa(
            conteudo=conteudo,
            descricao=request.form.get('descricao_tarefa', '').strip(),
            profissionais=request.form.get('profissionais', '').strip(),
            data_limite=datetime.strptime(request.form.get('data_limite'), '%Y-%m-%d') if request.form.get('data_limite') else None,
            categoria_id=int(categoria_id),
            prioridade=request.form.get('prioridade', 'Media'),
            status=request.form.get('status', 'Aberto'),
            numero_os=novo_numero
        )
        db.session.add(tarefa)
        db.session.commit()
        return jsonify({'success': True, 'tarefa_id': tarefa.id, 'numero_os': novo_numero}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Erro ao criar tarefa'}), 500

@app.route('/grupo/<slug>/criar-categoria', methods=['POST'])
def criar_categoria_grupo(slug):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    data = request.get_json()
    nome = data.get('nome', '').strip()
    if not nome or len(nome) > 50:
        return jsonify({'success': False, 'error': 'Nome inválido'}), 400
    cat = Categoria(
        nome=nome,
        cor=data.get('cor', '#ff6b6b'),
        icone=data.get('icone', 'infraestrutura'),
        grupo_id=grupo.id
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({'success': True, 'id': cat.id}), 201


@app.route('/grupo/<slug>/editar-categoria/<int:id>', methods=['PUT'])
def editar_categoria_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    cat = Categoria.query.filter_by(id=id, grupo_id=grupo.id).first_or_404()
    data = request.get_json()
    if 'nome' in data:
        nome = data['nome'].strip()
        if not nome or len(nome) > 50:
            return jsonify({'success': False, 'error': 'Nome inválido'}), 400
        cat.nome = nome
    if 'cor' in data: cat.cor = data['cor']
    if 'icone' in data: cat.icone = data['icone']
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/eliminar-categoria/<int:id>', methods=['DELETE'])
def eliminar_categoria_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    cat = Categoria.query.filter_by(id=id, grupo_id=grupo.id).first_or_404()
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/eliminar-tarefa/<int:id>', methods=['POST'])
def eliminar_tarefa_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    db.session.delete(tarefa)
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/atualizar-descricao/<int:id>', methods=['POST'])
def atualizar_descricao_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    data = request.get_json()
    if 'descricao' in data:
        nova = data['descricao'].strip()
        if len(nova) > 500:
            return jsonify({'success': False, 'error': 'Descrição muito longa'}), 400
        tarefa.descricao = nova
    if 'conteudo' in data:
        novo_titulo = data['conteudo'].strip()
        if not novo_titulo or len(novo_titulo) > 200:
            return jsonify({'success': False, 'error': 'Título inválido'}), 400
        tarefa.conteudo = novo_titulo
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/atualizar-profissionais/<int:id>', methods=['POST'])
def atualizar_profissionais_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    data = request.get_json()
    novos = data.get('profissionais', '').strip()
    if len(novos) > 200:
        return jsonify({'success': False, 'error': 'Campo profissionais muito longo'}), 400
    tarefa.profissionais = novos
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/concluir-chamado/<int:id>', methods=['POST'])
def concluir_chamado_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    tarefa.status = "Concluido"
    tarefa.feita = True
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/cancelar-chamado/<int:id>', methods=['POST'])
def cancelar_chamado_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    tarefa.status = "Cancelado"
    tarefa.feita = True
    db.session.commit()
    return jsonify({'success': True})


@app.route('/grupo/<slug>/tarefa-feita/<int:id>', methods=['POST'])
def feita_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    tarefa.feita = not tarefa.feita
    db.session.commit()
    return jsonify({'success': True, 'feita': tarefa.feita})


@app.route('/grupo/<slug>/detalhes-chamado/<int:id>')
def detalhes_chamado_grupo(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    return jsonify({
        'success': True,
        'id': tarefa.id,
        'titulo': tarefa.conteudo,
        'descricao': tarefa.descricao or '',
        'profissionais': tarefa.profissionais or '',
        'data_criacao': tarefa.data_criacao.isoformat(),
        'data_limite': tarefa.data_limite.isoformat() if tarefa.data_limite else None,
        'status': tarefa.status,
        'prioridade': tarefa.prioridade,
        'numero_os': tarefa.numero_os
    })

@app.route('/grupo/<slug>/tarefa/<int:id>/comentarios', methods=['GET'])
def listar_comentarios(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    comentarios = Comentario.query.filter_by(tarefa_id=id).order_by(Comentario.data_criacao.asc()).all()
    return jsonify([{
        'id': c.id,
        'texto': c.texto,
        'data_criacao': c.data_criacao.isoformat(),
        'membro_nome': c.membro_nome
    } for c in comentarios])


@app.route('/grupo/<slug>/tarefa/<int:id>/comentarios', methods=['POST'])
def adicionar_comentario(slug, id):
    grupo = Grupo.query.filter_by(slug=slug).first_or_404()
    tarefa = Tarefa.query.get_or_404(id)
    if tarefa.categoria.grupo_id != grupo.id:
        abort(404)
    data = request.get_json()
    texto = data.get('texto', '').strip()
    if not texto or len(texto) > 500:
        return jsonify({'success': False, 'error': 'Texto inválido'}), 400

    membro_id = session.get(f'membro_{slug}')
    membro_nome = session.get(f'membro_nome_{slug}')
    if not membro_nome:
        if grupo.membros:
            return jsonify({'success': False, 'error': 'Identifique-se para comentar'}), 401
        else:
            membro_nome = 'Anónimo'

    comentario = Comentario(
        texto=texto,
        tarefa_id=id,
        membro_id=membro_id,
        membro_nome=membro_nome
    )
    db.session.add(comentario)
    db.session.commit()
    return jsonify({'success': True, 'id': comentario.id}), 201


# ------------------------------------------------------------
# Inicialização da BD
# ------------------------------------------------------------
with app.app_context():
    db.create_all()
    print("✅ Base de dados pronta.")

if __name__ == '__main__':
    app.run(debug=True)