**Installation SSH:**

sudo apt install openssh-server

systemctl enable ssh

systemctl start ssh

**Puplic Key Auth:**

**Partner:** Filip Orlovic

| Verwendete Befehle | Funktion                           |
| ------------------ | ---------------------------------- |
| chmod              | Freigaben Kontrolle                |
| ssh-keygen         | Generiert Öffentlichen Schlüssel |
| nano               | Texteditor in Ubuntu               |

Er hat auf dem Pfad:

**~/.ssh/**

in der Datei:

**authorized_keys**

modifiziert mit

**chmod 700 ~/.ssh**
**chmod 600 ~/.ssh/authorized_keys**

meinen Puplic key eingetragen der mit:

**ssh-keygen -t rsa -b 4096 -C "du@example.com"**

auf meiner VM genertiert worden ist.

Der public key wurde mit netcat übertragen:
"nc -lnvp 8888 > rsa_pav"

und mit cat "rsa_pav" >> "authorized_keys" hinzugefügt

Mein Key kann mit dem Command:

**cat ~/.ssh/id_rsa.pub**

geöffnet werden. (oder nano id_rsa.pub)

Sobald er die Daten eingespeichert hat in seiner Datei konnte ich mich mit SSH ohne Passwort verbinden.

The End
