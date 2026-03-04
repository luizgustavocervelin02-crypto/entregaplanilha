document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding tab
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Lógica do Pop-up de Boas-Vindas ---
    const welcomeModal = document.getElementById('welcome-modal');
    const userNameInput = document.getElementById('user-name-input');
    const saveNameBtn = document.getElementById('save-name-btn');
    const nameError = document.getElementById('name-error');
    const displayUserName = document.getElementById('display-user-name');
    const certStudentName = document.querySelector('.student-name');

    // Recuperar nome salvo, se houver
    const savedName = localStorage.getItem('membersAreaUserName');

    if (savedName) {
        welcomeModal.style.display = 'none';
        displayUserName.textContent = savedName;
        certStudentName.textContent = savedName;
    }

    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNameBtn.click();
        }
    });

    saveNameBtn.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        if (name.length >= 2) {
            localStorage.setItem('membersAreaUserName', name);

            // Set start date if it doesn't exist
            if (!localStorage.getItem('membersAreaStartDate')) {
                localStorage.setItem('membersAreaStartDate', new Date().toISOString());
            }

            displayUserName.textContent = name;
            certStudentName.textContent = name;
            welcomeModal.style.display = 'none';
            nameError.style.display = 'none';
        } else {
            nameError.style.display = 'block';
        }
    });

    // --- Lógica do Certificado ---
    const downloadBtn = document.getElementById('download-cert-btn');
    const certMessage = document.getElementById('cert-status-message');
    const certDateSpan = document.getElementById('cert-date');
    const certificateTemplate = document.getElementById('certificate-template');

    // Lógica do bloqueio de 7 dias
    const testMode = false; // Desativando o modo de teste para bloquear de verdade
    const daysRequired = 7;

    // Recupera a data de início ou usa a de hoje como fallback (se burlar o modal de alguma forma)
    const startDateString = localStorage.getItem('membersAreaStartDate');
    const startDate = startDateString ? new Date(startDateString) : new Date();

    // Calcula os dias passados
    const today = new Date();
    const timeDiff = today.getTime() - startDate.getTime();
    const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));

    // Exibe a data de hoje no certificado
    certDateSpan.textContent = today.toLocaleDateString('pt-BR');

    if (!testMode && daysPassed < daysRequired) {
        // Bloqueia o download
        downloadBtn.disabled = true;
        downloadBtn.classList.add('disabled');
        downloadBtn.style.opacity = '0.5';
        downloadBtn.style.cursor = 'not-allowed';
        certMessage.style.display = 'flex';

        // Atualiza a mensagem para mostrar quantos dias faltam
        const daysLeft = daysRequired - daysPassed;
        const certMsgText = certMessage.querySelector('p');
        if (certMsgText) {
            certMsgText.innerHTML = `Seu certificado oficial estará disponível em <strong>${daysLeft} dia(s)</strong>.`;
        }
    }

    // Função para gerar o PDF
    downloadBtn.addEventListener('click', () => {
        if (!testMode && daysPassed < daysRequired) return;

        // Recuperar o nome, usar um padrão caso não encontre
        const studentName = localStorage.getItem('membersAreaUserName') || 'Membro VIP';

        // Define o titulo usando o nome do aluno
        const formattedFileName = `Certificado_Conclusao_${studentName.replace(/\s+/g, '_')}.pdf`;

        // Opções melhoradas para a biblioteca html2pdf
        const opt = {
            margin: [10, 10, 10, 10], // Adicionada margem pequena
            filename: formattedFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'pt', format: 'letter', orientation: 'landscape' }
        };

        // Prepara o botão exibindo estado de carregamento
        const originalBtnText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
        downloadBtn.disabled = true;

        // Altera temporariamente o estilo para garantir que renderize corretamente no PDF
        const originalBoxShadow = certificateTemplate.style.boxShadow;
        certificateTemplate.style.boxShadow = 'none';

        // Gera o PDF
        html2pdf().set(opt).from(certificateTemplate).save().then(() => {
            // Restaura o botão e o estilo
            downloadBtn.innerHTML = originalBtnText;
            downloadBtn.disabled = false;
            certificateTemplate.style.boxShadow = originalBoxShadow;
        }).catch(err => {
            console.error("Erro ao gerar certificado: ", err);
            downloadBtn.innerHTML = originalBtnText;
            downloadBtn.disabled = false;
            certificateTemplate.style.boxShadow = originalBoxShadow;
            alert("Houve um erro ao gerar o certificado. Tente novamente.");
        });
    });
});
