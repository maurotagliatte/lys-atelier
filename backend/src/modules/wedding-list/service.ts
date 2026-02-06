import { MedusaService } from "@medusajs/framework/utils"
import { WeddingList } from "./models/wedding-list"

class WeddingListModuleService extends MedusaService({ WeddingList }) {
  /**
   * Generates a URL-safe slug from couple names.
   *
   * Removes diacritics/accents, strips special characters,
   * and converts to lowercase with dashes as separators.
   *
   * @example
   *   generateSlug("João & Maria")  // "joao-maria"
   *   generateSlug("André e Cláudia") // "andre-e-claudia"
   */
  generateSlug(coupleNames: string): string {
    return coupleNames
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[&+]/g, " ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
  }

  /**
   * Checks whether a given slug is available (not already taken).
   *
   * @returns true if available, false if already in use.
   */
  async validateSlugAvailability(slug: string): Promise<boolean> {
    const [existing] = await this.listWeddingLists(
      { slug },
      { take: 1 }
    )

    return !existing
  }

  /**
   * Retrieves a single wedding list by its public-facing slug.
   *
   * @throws If no wedding list is found for the provided slug.
   */
  async getBySlug(slug: string): Promise<Record<string, unknown>> {
    const [weddingLists, count] = await this.listAndCountWeddingLists(
      { slug },
      { take: 1 }
    )

    if (count === 0) {
      throw new Error(`Wedding list with slug "${slug}" not found.`)
    }

    return weddingLists[0]
  }

  /**
   * Generates a unique slug for a wedding list, handling collisions.
   *
   * If the base slug derived from couple names is already taken,
   * appends the wedding year first, then increments a numeric
   * suffix until a unique slug is found.
   *
   * @param coupleNames - The couple's display names.
   * @param weddingDate - The wedding date, used to derive a year suffix.
   * @returns A guaranteed-unique slug string.
   */
  async generateUniqueSlug(
    coupleNames: string,
    weddingDate?: Date | string
  ): Promise<string> {
    const baseSlug = this.generateSlug(coupleNames)

    if (await this.validateSlugAvailability(baseSlug)) {
      return baseSlug
    }

    if (weddingDate) {
      const year = new Date(weddingDate).getFullYear()
      const slugWithYear = `${baseSlug}-${year}`

      if (await this.validateSlugAvailability(slugWithYear)) {
        return slugWithYear
      }
    }

    let counter = 2
    let candidateSlug = `${baseSlug}-${counter}`

    while (!(await this.validateSlugAvailability(candidateSlug))) {
      counter++
      candidateSlug = `${baseSlug}-${counter}`

      if (counter > 100) {
        throw new Error(
          `Unable to generate a unique slug for "${coupleNames}" after 100 attempts.`
        )
      }
    }

    return candidateSlug
  }
}

export default WeddingListModuleService
