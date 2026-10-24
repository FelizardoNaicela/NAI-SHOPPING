import { useState } from "react";
import { updateProfile, refreshProfile } from "../../services/users";
import styles from "./EditProfileForm.module.css";
import { useEffect } from "react";
import { COUNTRIES, REGIONS } from "../../shared/regions";

type Props = {
    profile: any;
    onUpdated: (profile: any) => void;
};

export default function EditProfileForm({

    profile,

    onUpdated,

}: Props) {
    const [saving, setSaving] =
        useState(false);

    const [form, setForm] =
        useState({

            username:
                profile.username || "",

            name:
                profile.name || "",

            phone:
                profile.phone || "",

            bio:
                profile.bio || "",

            countryCode:
                profile.countryCode || "",

            region:
                profile.region || "",

        });

        const [availableRegions, setAvailableRegions] =
    useState<string[]>([]);

    useEffect(() => {

    setAvailableRegions(

        REGIONS[
            form.countryCode as keyof typeof REGIONS
        ] || []

    );

}, [form.countryCode]);

    function updateField(
        field: string,
        value: string,
    ) {

        setForm(prev => ({
            ...prev,
            [field]: value,
        }));

    }

    async function save() {

        try {

            setSaving(true);

            await updateProfile(form);

            const updated =
                await refreshProfile();

            onUpdated(updated);

            alert("Perfil atualizado!");

        } catch (err: any) {

            alert(
                err.response?.data?.message ??
                "Erro ao atualizar perfil."
            );

        } finally {

            setSaving(false);

        }

    }

    return (

       <div className={styles.card}>

    <h2 className={styles.title}>
        Editar Perfil
    </h2>

    <label className={styles.label}>
        Username
    </label>

    <input
        className={styles.input}
        value={form.username}
        onChange={e =>
            updateField(
                "username",
                e.target.value,
            )
        }
    />

    <label className={styles.label}>
        Nome
    </label>

    <input
        className={styles.input}
        value={form.name}
        onChange={e =>
            updateField(
                "name",
                e.target.value,
            )
        }
    />

    <label className={styles.label}>
        Telefone
    </label>

    <input
        className={styles.input}
        value={form.phone}
        onChange={e =>
            updateField(
                "phone",
                e.target.value,
            )
        }
    />

    <label className={styles.label}>
        Bio
    </label>

    <textarea
        className={styles.textarea}
        rows={5}
        value={form.bio}
        onChange={e =>
            updateField(
                "bio",
                e.target.value,
            )
        }
    />

    <label className={styles.label}>
        País
    </label>

    <select
        className={styles.select}
        value={form.countryCode}
        onChange={e => {

            updateField(
                "countryCode",
                e.target.value,
            );

            updateField(
                "region",
                "",
            );

        }}
    >

        {COUNTRIES.map(country => (

            <option
                key={country.code}
                value={country.code}
            >

                {country.name}

            </option>

        ))}

    </select>

    <label className={styles.label}>
        Região
    </label>

    <select
        className={styles.select}
        value={form.region}
        onChange={e =>
            updateField(
                "region",
                e.target.value,
            )
        }
    >

        <option value="">
            Selecionar região
        </option>

        {availableRegions.map(region => (

            <option
                key={region}
                value={region}
            >

                {region}

            </option>

        ))}

    </select>

    <button
        className={styles.submitButton}
        onClick={save}
        disabled={saving}
    >

        {saving
            ? "Guardando..."
            : "Guardar alterações"}

    </button>

</div>

    );

}